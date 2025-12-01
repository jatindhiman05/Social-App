import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../utils/userSilce";
import {
    setNotification,
    markAllAsRead as markAllAsReadAction,
    markAsRead as markAsReadAction,
    addNotification
} from "../utils/notificationsSlice";
import {
    Search,
    PenSquare,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Loader2,
    Bell,
    BellDot,
    Check,
    CheckCircle,
    Moon,
    Sun,
    Heart,
    MessageSquare,
    UserPlus,
    Edit
} from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import axios from "axios";

const Navbar = () => {
    const { token, name, profilePic, username, id: userId } = useSelector(
        (state) => state.user
    );
    const { notifications, unreadCount } = useSelector((state) => state.notifications);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const popupRef = useRef(null);
    const notificationRef = useRef(null);

    const [showPopup, setShowPopup] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [socket, setSocket] = useState(null);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

    // Initialize theme on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem("theme", newDarkMode ? "dark" : "light");

        if (newDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    // Socket event listeners
    useEffect(() => {
        if (!token || !userId) return;

        const newSocket = io(import.meta.env.VITE_BACKEND_SOCKET_URL, {
            query: {  
                userId: userId,
                token: token
            },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            // Register the user with their ID
            newSocket.emit("register", userId);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        newSocket.on("newNotification", (notification) => {
            console.log("New notification received:", notification);
            dispatch(addNotification(notification));
            toast.success("New notification received");
        });

        setSocket(newSocket);

        return () => {
            newSocket.off("connect");
            newSocket.off("disconnect");
            newSocket.off("connect_error");
            newSocket.off("newNotification");
            newSocket.disconnect();
        };
    }, [token, userId, dispatch]);

    useEffect(() => {
        if (!token) return;

        const fetchNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/notifications?limit=4`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                dispatch(setNotification({
                    notifications: response.data.notifications,
                    unreadCount: response.data.unreadCount
                }));
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to load notifications");
                console.error("Error fetching notifications:", error);
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotifications();
    }, [token, dispatch]);

    const handleLogout = () => {
        setIsLoggingOut(true);
        setTimeout(() => {
            dispatch(logout());
            setShowPopup(false);
            setMobileMenuOpen(false);
            setIsLoggingOut(false);
            navigate('/');
            window.location.reload();
        }, 1000);
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/notifications/mark-read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(markAllAsReadAction());
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark notifications as read");
            console.error("Error marking notifications as read:", error);
        }
    };

    const markSingleAsRead = async (notificationId, e) => {
        e.stopPropagation();
        try {
            await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(markAsReadAction(notificationId));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval}y ago`;

        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval}mo ago`;

        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval}d ago`;

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval}h ago`;

        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval}m ago`;

        return 'Just now';
    };

    const notificationIcon = unreadCount > 0 ? (
        <div className="relative">
            <BellDot className="h-5 w-5 text-indigo-600 dark:text-accent" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
            </span>
        </div>
    ) : (
        <Bell className="h-5 w-5 text-gray-600 dark:text-darktext/80" />
    );

    const renderNotificationMessage = (notification) => {
        switch (notification.type) {
            case 'like':
                return 'liked your post';
            case 'comment':
                return 'commented on your post';
            case 'comment-like':
                return 'liked your comment';
            case 'follow':
                return 'started following you';
            case 'reply':
                return 'replied to your comment';
            case 'blog-update':
                return 'updated their post';
            default:
                return notification.message || 'sent you a notification';
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                const profileButton = document.querySelector('.profile-button');
                if (!profileButton || !profileButton.contains(event.target)) {
                    setShowPopup(false);
                }
            }

            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                const notificationButton = document.querySelector('.notification-button');
                if (!notificationButton || !notificationButton.contains(event.target)) {
                    setShowNotifications(false);
                }
            }
        }

        if (showPopup || showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPopup, showNotifications]);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-darkbg shadow-sm dark:shadow-gray-800/50 border-gray-200 dark:border-darkborder">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    {/* Left section - Logo + Search */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-accent dark:to-indigo-400 flex items-center justify-center text-white font-bold shadow-sm">
                                JD
                            </div>
                            <span className="hidden sm:block text-lg font-semibold text-gray-900 dark:text-darktext">
                                Journal
                            </span>
                        </Link>

                        {/* Desktop Search */}
                        <div className="hidden md:block relative w-72">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 dark:text-darktext/70" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchQuery.trim()) {
                                        navigate(`/search?q=${searchQuery.trim()}`);
                                        setSearchQuery("");
                                    }
                                }}
                                className="w-full bg-gray-50 dark:bg-darkcard text-sm text-gray-800 dark:text-darktext focus:ring-1 focus:ring-indigo-500 dark:focus:ring-accent focus:outline-none rounded-lg pl-10 pr-4 py-2 placeholder:text-gray-400 dark:placeholder:text-darktext/70  border-gray-300 dark:border-darkborder hover:border-indigo-300 dark:hover:border-accent transition-all"
                            />
                        </div>
                    </div>

                    {/* Mobile menu buttons */}
                    <div className="flex md:hidden items-center gap-4">
                        <button
                            onClick={() => setShowSearchBar(!showSearchBar)}
                            className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors"
                        >
                            <Search size={20} />
                        </button>
                        {token && (
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors notification-button"
                            >
                                {notificationIcon}
                            </button>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Desktop Navigation and Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Dark mode toggle button */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors"
                            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {darkMode ? (
                                <Sun className="h-5 w-5 text-gray-600 dark:text-yellow-400" />
                            ) : (
                                <Moon className="h-5 w-5 text-gray-600 dark:text-darktext/80" />
                            )}
                        </button>

                        {token ? (
                            <>
                                <Link
                                    to="/add-blog"
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm"
                                >
                                    <PenSquare size={16} />
                                    <span>Write</span>
                                </Link>

                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors relative notification-button"
                                >
                                    {notificationIcon}
                                </button>

                                <div className="relative ml-2" ref={popupRef}>
                                    <button
                                        onClick={() => setShowPopup(!showPopup)}
                                        className="flex items-center gap-1 focus:outline-none group profile-button"
                                    >
                                        <img
                                            src={
                                                profilePic ||
                                                `https://api.dicebear.com/7.x/initials/svg?seed=${name}&background=indigo`
                                            }
                                            alt={name}
                                            className="w-8 h-8 rounded-full object-cover  border-gray-200 dark:border-darkborder group-hover:border-indigo-400 dark:group-hover:border-accent cursor-pointer transition-all"
                                        />
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-500 dark:text-darktext/70 transition-transform ${showPopup ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {showPopup && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-darkcard rounded-lg shadow-md  border-gray-200 dark:border-darkborder overflow-hidden z-50">
                                            <div className="px-4 py-3  border-gray-200 dark:border-darkborder">
                                                <p className="text-sm font-medium text-gray-900 dark:text-darktext">{name}</p>
                                                <p className="text-xs text-gray-500 dark:text-darktext/70">@{username}</p>
                                            </div>
                                            <Link
                                                to={`/@${username}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-darkbg text-gray-700 dark:text-darktext text-sm transition-colors"
                                                onClick={() => setShowPopup(false)}
                                            >
                                                <User size={16} className="text-indigo-500 dark:text-accent" />
                                                <span>Profile</span>
                                            </Link>
                                            <Link
                                                to="/setting"
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-darkbg text-gray-700 dark:text-darktext text-sm transition-colors"
                                                onClick={() => setShowPopup(false)}
                                            >
                                                <Settings size={16} className="text-indigo-500 dark:text-accent" />
                                                <span>Settings</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-darkbg text-sm transition-colors  border-gray-200 dark:border-darkborder"
                                                disabled={isLoggingOut}
                                            >
                                                {isLoggingOut ? (
                                                    <Loader2 size={16} className="animate-spin text-red-500 dark:text-red-300" />
                                                ) : (
                                                    <LogOut size={16} className="text-red-500 dark:text-red-300" />
                                                )}
                                                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Link to="/signin">
                                    <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-darktext hover:text-indigo-600 dark:hover:text-accent hover:bg-gray-50 dark:hover:bg-darkbg rounded-lg transition-colors">
                                        Sign In
                                    </button>
                                </Link>
                                <Link to="/signup">
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-500 rounded-lg shadow-sm transition-colors">
                                        Sign Up
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification dropdown */}
                {showNotifications && (
                    <div
                        className="absolute right-4 md:right-8 top-16 w-80 md:w-96 bg-white dark:bg-darkcard rounded-lg shadow-lg border border-gray-200 dark:border-darkborder overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
                        ref={notificationRef}
                    >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-darkborder flex justify-between items-center">
                            <h3 className="font-medium text-gray-900 dark:text-darktext">Notifications</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-indigo-600 dark:text-accent hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <Link
                                    to="/notifications"
                                    onClick={() => setShowNotifications(false)}
                                    className="text-sm text-indigo-600 dark:text-accent hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>

                        {loadingNotifications ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="animate-spin text-indigo-600 dark:text-accent" size={24} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-darktext/70">
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-darkborder">
                                {notifications.slice(0, 3).map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-darkbg transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                markSingleAsRead(notification._id);
                                            }
                                            if (notification.blog) {
                                                navigate(`/blog/${notification.blog.blogId}`);
                                            } else if (notification.sender) {
                                                navigate(`/@${notification.sender.username}`);
                                            }
                                            setShowNotifications(false);
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={notification.sender?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${notification.sender?.name}&background=indigo`}
                                                alt={notification.sender?.name}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-darkborder"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800 dark:text-darktext">
                                                    <span className="font-medium">{notification.sender?.name}</span> {renderNotificationMessage(notification)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-darktext/70 mt-1">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                                {notification.blog && (
                                                    <p className="text-xs text-indigo-600 dark:text-accent mt-1 truncate">
                                                        {notification.blog.title}
                                                    </p>
                                                )}
                                            </div>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => markSingleAsRead(notification._id, e)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-accent p-1"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile search bar */}
                {showSearchBar && (
                    <div className="md:hidden px-4 py-3 bg-white dark:bg-darkbg  border-gray-200 dark:border-darkborder">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 dark:text-darktext/70" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchQuery.trim()) {
                                        navigate(`/search?q=${searchQuery.trim()}`);
                                        setSearchQuery("");
                                        setShowSearchBar(false);
                                    }
                                }}
                                className="w-full bg-gray-50 dark:bg-darkcard text-sm text-gray-800 dark:text-darktext focus:ring-1 focus:ring-indigo-500 dark:focus:ring-accent focus:outline-none rounded-lg pl-10 pr-4 py-2 placeholder:text-gray-400 dark:placeholder:text-darktext/70 border border-gray-300 dark:border-darkborder hover:border-indigo-300 dark:hover:border-accent transition-all"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-darkbg  border-gray-200 dark:border-darkborder shadow-sm">
                        <div className="px-4 py-3 space-y-2">
                            {token ? (
                                <>
                                    <div className="flex items-center gap-3 px-3 py-3  border-b border-gray-200 dark:border-darkborder">
                                        <img
                                            src={
                                                profilePic ||
                                                `https://api.dicebear.com/7.x/initials/svg?seed=${name}&background=indigo`
                                            }
                                            alt={name}
                                            className="w-10 h-10 rounded-full object-cover  border-gray-200 dark:border-darkborder"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-darktext">{name}</p>
                                            <p className="text-xs text-gray-500 dark:text-darktext/70">@{username}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/@${username}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-darktext rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg"
                                    >
                                        <User size={16} className="text-indigo-500 dark:text-accent" />
                                        <span>Profile</span>
                                    </Link>
                                    <Link
                                        to="/add-blog"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-darktext rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg"
                                    >
                                        <PenSquare size={16} />
                                        <span>Write Article</span>
                                    </Link>
                                    <Link
                                        to="/setting"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-darktext rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg"
                                    >
                                        <Settings size={16} className="text-indigo-500 dark:text-accent" />
                                        <span>Settings</span>
                                    </Link>
                                    {/* Dark mode toggle in mobile menu */}
                                    <button
                                        onClick={toggleDarkMode}
                                        className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-darktext rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg w-full"
                                    >
                                        {darkMode ? (
                                            <Sun size={16} className="text-indigo-500 dark:text-yellow-400" />
                                        ) : (
                                            <Moon size={16} className="text-indigo-500 dark:text-accent" />
                                        )}
                                        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-darkbg mt-2"
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <Loader2 size={16} className="animate-spin text-red-500 dark:text-red-300" />
                                        ) : (
                                            <LogOut size={16} className="text-red-500 dark:text-red-300" />
                                        )}
                                        <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    {/* Dark mode toggle in mobile menu for non-logged in users */}
                                    <button
                                        onClick={toggleDarkMode}
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-darktext rounded-lg hover:bg-gray-50 dark:hover:bg-darkbg w-full"
                                    >
                                        {darkMode ? (
                                            <Sun size={16} className="text-indigo-500 dark:text-yellow-400" />
                                        ) : (
                                            <Moon size={16} className="text-indigo-500 dark:text-accent" />
                                        )}
                                        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                                    </button>
                                    <Link
                                        to="/signin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:text-darktext hover:bg-gray-50 dark:hover:bg-darkbg rounded-lg"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-4 py-2.5 text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-500 rounded-lg shadow-sm"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-16 min-h-screen bg-gray-50 dark:bg-darkbg">
                <Outlet />
            </main>
        </>
    );
};

export default Navbar;