import axios from "axios";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { updateData, logout } from "../utils/userSilce";
import { applyTheme, getCurrentTheme } from "../utils/theme";
import {
    Settings,
    Lock,
    Eye,
    ChevronDown,
    ArrowLeft,
    Key,
    User,
    Trash2,
    AlertTriangle,
    Mail,
} from "lucide-react";
import Modal from "./Modal";

function Setting() {
    const { token, id: userId, showLikedBlogs, showSavedBlogs, googleAuth, email } = useSelector(
        (state) => state.user
    );

    const [data, setData] = useState({
        showLikedBlogs,
        showSavedBlogs,
    });
    const [activeTab, setActiveTab] = useState("privacy");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState("light");

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Account state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferEmail, setTransferEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
    const [transferErrors, setTransferErrors] = useState({
        email: "",
        password: ""
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Initialize theme on component mount
    useEffect(() => {
        const savedThemePreference = localStorage.getItem("theme") || "system";
        setSelectedTheme(savedThemePreference);
    }, []);

    async function handleVisibility() {
        setIsLoading(true);
        try {
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/change-saved-liked-blog-visibility`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(updateData(["visibility", data]));
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsLoading(false);
        }
    }

    function handleSavePreferences() {
        const appliedTheme = applyTheme(selectedTheme);
        setSelectedTheme(selectedTheme);
        toast.success(`Theme set to ${appliedTheme}`);
    }

    async function handlePasswordChange() {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/auth/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            dispatch(logout());
            navigate('/signin');
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteAccount() {
        if (!googleAuth && !deleteAccountPassword) {
            toast.error("Please enter your current password");
            return;
        }

        try {
            setIsDeleting(true);
            const res = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    data: {
                        currentPassword: deleteAccountPassword,
                        googleAuth: googleAuth
                    }
                }
            );
            toast.success(res.data.message);
            dispatch(logout());
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setDeleteAccountPassword("");
        }
    }

    const validateTransferInputs = () => {
        const errors = {};
        let isValid = true;

        if (!transferEmail) {
            errors.email = "Recipient email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transferEmail)) {
            errors.email = "Invalid email format";
            isValid = false;
        } else if (transferEmail === email) {
            errors.email = "Cannot transfer to yourself";
            isValid = false;
        }

        if (!googleAuth && !currentPassword) {
            errors.password = "Current password is required";
            isValid = false;
        }

        setTransferErrors(errors);
        return isValid;
    };

    async function handleTransferOwnership() {
        if (!validateTransferInputs()) return;

        try {
            setIsTransferring(true);
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/transfer-account`,
                {
                    newOwnerEmail: transferEmail,
                    currentPassword: googleAuth ? undefined : currentPassword,
                    googleAuth
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success(res.data.message);

            // Logout after a delay to show success message
            setTimeout(() => {
                dispatch(logout());
                navigate("/");
            }, 2000);

        } catch (error) {
            console.error('Transfer error:', error);
            const errorMsg = error.response?.data?.message || "Failed to transfer ownership";

            // Handle specific error cases
            if (error.response?.data?.error?.includes('password')) {
                setTransferErrors(prev => ({ ...prev, password: 'Incorrect password' }));
            } else if (error.response?.data?.error?.includes('email')) {
                setTransferErrors(prev => ({ ...prev, email: 'User not found with this email' }));
            }

            toast.error(errorMsg);
        } finally {
            setIsTransferring(false);
            setIsTransferModalOpen(false);
        }
    }

    if (!token) return <Navigate to="/signin" />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-12 px-4 sm:px-6">
            {/* Delete Account Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteAccountPassword("");
                }}
                title="Delete Account"
                maxWidth="max-w-md"
                actionButton={
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || (!googleAuth && !deleteAccountPassword)}
                        className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${isDeleting || (!googleAuth && !deleteAccountPassword) ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-darktext">
                        Are you sure you want to delete your account? This action cannot be undone.
                        All your data including blogs, likes, and saved posts will be permanently
                        removed.
                    </p>

                    {!googleAuth && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-darktext">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={deleteAccountPassword}
                                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-darkbg rounded-md"
                                placeholder="Enter your current password"
                            />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Transfer Ownership Confirmation Modal */}
            <Modal
                isOpen={isTransferModalOpen}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    setTransferErrors({ email: "", password: "" });
                }}
                title="Confirm Account Transfer"
                maxWidth="max-w-md"
                actionButton={
                    <button
                        onClick={handleTransferOwnership}
                        disabled={isTransferring}
                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-400 text-white rounded-lg transition-colors ${isTransferring ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isTransferring ? "Processing..." : "Confirm Transfer"}
                    </button>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-gray-700 dark:text-darktext">
                                You are about to transfer all your content to <span className="font-semibold">{transferEmail}</span>.
                                This includes:
                            </p>
                            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>All your blog posts</li>
                                <li>All your comments</li>
                                <li>Your followers and following relationships</li>
                            </ul>
                            <p className="mt-3 text-red-500 dark:text-red-400 text-sm">
                                Warning: This action cannot be undone. You will lose access to this account.
                            </p>
                        </div>
                    </div>

                    {!googleAuth && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-darktext">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${transferErrors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                                placeholder="Enter your current password"
                            />
                            {transferErrors.password && (
                                <p className="mt-1 text-sm text-red-500">{transferErrors.password}</p>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-darktext dark:hover:text-accent mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-darkbg">
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-darktext flex items-center gap-2">
                                    <Settings className="text-indigo-600 dark:text-accent" />
                                    Settings
                                </h1>
                            </div>
                            <nav className="space-y-1 px-2 pb-4">
                                <button
                                    onClick={() => setActiveTab("privacy")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${activeTab === "privacy"
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-darkbg dark:text-accent"
                                        : "text-gray-700 hover:bg-gray-50 dark:text-darktext dark:hover:bg-darkbg"
                                        }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span>Privacy Settings</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("interface")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${activeTab === "interface"
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-darkbg dark:text-accent"
                                        : "text-gray-700 hover:bg-gray-50 dark:text-darktext dark:hover:bg-darkbg"
                                        }`}
                                >
                                    <Eye className="w-5 h-5" />
                                    <span>Interface Preferences</span>
                                </button>

                                {/* Only show Change Password tab if not using Google Auth */}
                                {!googleAuth && (
                                    <button
                                        onClick={() => setActiveTab("password")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${activeTab === "password"
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-darkbg dark:text-accent"
                                            : "text-gray-700 hover:bg-gray-50 dark:text-darktext dark:hover:bg-darkbg"
                                            }`}
                                    >
                                        <Key className="w-5 h-5" />
                                        <span>Change Password</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setActiveTab("account")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${activeTab === "account"
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-darkbg dark:text-accent"
                                        : "text-gray-700 hover:bg-gray-50 dark:text-darktext dark:hover:bg-darkbg"
                                        }`}
                                >
                                    <User className="w-5 h-5" />
                                    <span>Account</span>
                                </button>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-6 md:p-8 text-gray-900 dark:text-darktext">
                            {activeTab === "privacy" && (
                                <>
                                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <Eye className="text-indigo-600 dark:text-accent" />
                                        Privacy Settings
                                    </h2>

                                    <div className="space-y-6">
                                        {["Saved", "Liked"].map((label) => {
                                            const key = `show${label}Blogs`;
                                            return (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium mb-2">
                                                        Show {label} Blogs on Profile
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            value={data[key]}
                                                            onChange={(e) =>
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    [key]: e.target.value === "true",
                                                                }))
                                                            }
                                                            className="appearance-none w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg text-black dark:text-darktext rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        >
                                                            <option value="true">Visible to everyone</option>
                                                            <option value="false">Only visible to me</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Control who can see your {label.toLowerCase()} blog posts
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        <button
                                            onClick={handleVisibility}
                                            disabled={isLoading}
                                            className={`w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            {isLoading ? "Saving..." : "Save Privacy Settings"}
                                        </button>
                                    </div>
                                </>
                            )}

                            {activeTab === "interface" && (
                                <>
                                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <Eye className="text-indigo-600 dark:text-accent" />
                                        Interface Preferences
                                    </h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Theme
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={selectedTheme}
                                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                                    className="appearance-none w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-darkbg bg-white dark:bg-darkbg text-black dark:text-darktext rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="light">Light Mode</option>
                                                    <option value="dark">Dark Mode</option>
                                                    <option value="system">System Default</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                Current applied theme: {getCurrentTheme()}
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleSavePreferences}
                                            className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
                                        >
                                            Save Preferences
                                        </button>
                                    </div>
                                </>
                            )}

                            {activeTab === "password" && (
                                <>
                                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <Key className="text-indigo-600 dark:text-accent" />
                                        Change Password
                                    </h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        currentPassword: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-darkbg dark:bg-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        newPassword: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-darkbg dark:bg-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        confirmPassword: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-darkbg dark:bg-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <button
                                            onClick={handlePasswordChange}
                                            disabled={isLoading}
                                            className={`w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            {isLoading ? "Changing..." : "Change Password"}
                                        </button>
                                    </div>
                                </>
                            )}

                            {activeTab === "account" && (
                                <>
                                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <User className="text-indigo-600 dark:text-accent" />
                                        Account Settings
                                    </h2>

                                    <div className="space-y-8">
                                        <div className="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
                                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                                                <AlertTriangle className="text-red-600 dark:text-red-400" />
                                                Dangerous Zone
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">
                                                        Transfer Account Ownership
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        Transfer all your blogs and content to another user.
                                                        This action cannot be undone. The recipient must accept the transfer.
                                                    </p>
                                                    <div className="flex flex-col gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">
                                                                Recipient's Email
                                                            </label>
                                                            <input
                                                                type="email"
                                                                value={transferEmail}
                                                                onChange={(e) => setTransferEmail(e.target.value)}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${transferErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                                    }`}
                                                                placeholder="Enter recipient's email"
                                                            />
                                                            {transferErrors.email && (
                                                                <p className="mt-1 text-sm text-red-600">{transferErrors.email}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => setIsTransferModalOpen(true)}
                                                            disabled={!transferEmail}
                                                            className={`px-4 py-2 border border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${!transferEmail ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                        >
                                                            Initiate Transfer
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">
                                                        Delete Account
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        Permanently delete your account and all associated data.
                                                        This action cannot be undone.
                                                    </p>
                                                    <button
                                                        onClick={() => setIsDeleteModalOpen(true)}
                                                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-darkbg transition-colors"
                                                    >
                                                        Delete Account
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Setting;