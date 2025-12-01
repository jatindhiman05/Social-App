import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    setNotification,
    markAllAsRead as markAllAsReadAction,
    markAsRead as markAsReadAction,
    deleteNotification
} from "../utils/notificationsSlice";
import {
    Bell,
    BellOff,
    Check,
    ChevronDown,
    Loader2,
    Trash2,
    ArrowLeft,
    Heart,
    MessageSquare,
    UserPlus,
    Edit,
    X,
    CheckCircle,
    MoreVertical
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { smartFormatDate } from "../utils/formatDate";

function Notifications() {
    const { token } = useSelector((state) => state.user);
    const { notifications, unreadCount } = useSelector((state) => state.notifications);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/notifications`,
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
                console.error("Error fetching notifications:", error);
                toast.error("Failed to load notifications");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchNotifications();
        }
    }, [token, dispatch]);

    const filteredNotifications = notifications.filter(notification => {
        if (activeTab === "all") return true;
        if (activeTab === "unread") return !notification.isRead;
        return notification.type === activeTab;
    });

    const markAllAsRead = async () => {
        try {
            setIsMarkingRead(true);
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
        } finally {
            setIsMarkingRead(false);
        }
    };

    const clearAllNotifications = async () => {
        try {
            setIsDeleting(true);
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(setNotification({ notifications: [], unreadCount: 0 }));
            toast.success("All notifications cleared");
            setClearAllModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to clear notifications");
        } finally {
            setIsDeleting(false);
        }
    };

    const markSingleAsRead = async (notificationId, e) => {
        if (e) e.stopPropagation();
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

    const handleDeleteNotification = async () => {
        if (!selectedNotification) return;

        try {
            setIsDeleting(true);
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/notifications/${selectedNotification._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(deleteNotification(selectedNotification._id));
            toast.success("Notification deleted");
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete notification");
        } finally {
            setIsDeleting(false);
            setSelectedNotification(null);
        }
    };

    const renderNotificationContent = (notification) => {
        const actionMap = {
            'like': {
                text: 'liked your post',
                icon: <Heart className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                link: `/blog/${notification.blog?.blogId}`,
                linkText: notification.blog?.title
            },
            'comment': {
                text: 'commented on your post',
                icon: <MessageSquare className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                content: notification.comment?.comment,
                link: `/blog/${notification.blog?.blogId}`,
                linkText: notification.blog?.title
            },
            'comment-like': {
                text: 'liked your comment',
                icon: <Heart className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                link: `/blog/${notification.blog?.blogId}`,
                linkText: notification.blog?.title
            },
            'follow': {
                text: 'started following you',
                icon: <UserPlus className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                link: `/@${notification.sender?.username}`,
                linkText: `@${notification.sender?.username}`
            },
            'reply': {
                text: 'replied to your comment',
                icon: <MessageSquare className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                content: notification.comment?.comment,
                link: `/blog/${notification.blog?.blogId}`,
                linkText: notification.blog?.title
            },
            'blog-update': {
                text: 'updated their post',
                icon: <Edit className="w-4 h-4 inline mr-1 dark:text-darktext" />,
                link: `/blog/${notification.blog?.blogId}`,
                linkText: notification.blog?.title
            }
        };

        const currentAction = actionMap[notification.type] || {
            text: notification.message || 'sent you a notification',
            icon: <Bell className="w-4 h-4 inline mr-1" />
        };

        return (
            <div className="space-y-1">
                <div className="inline-flex items-center">
                    {currentAction.icon}
                    <span className="dark:text-darktext">{currentAction.text}</span>
                </div>

                {currentAction.content && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-darkbg rounded-lg border border-gray-200 dark:border-darkborder">
                        <p className="text-sm text-gray-800 dark:text-darktext">
                            {currentAction.content}
                        </p>
                    </div>
                )}

                {currentAction.link && (
                    <Link
                        to={currentAction.link}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 dark:text-accent hover:underline block mt-1"
                    >
                        {currentAction.linkText}
                    </Link>
                )}
            </div>
        );
    };

    if (!token) return <Navigate to="/signin" />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg py-6 px-4 sm:px-6">
            {/* Delete Notification Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedNotification(null);
                }}
                title="Delete Notification"
                maxWidth="max-w-md"
                actionButton={
                    <button
                        onClick={handleDeleteNotification}
                        disabled={isDeleting}
                        className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${isDeleting ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-darktext">
                        Are you sure you want to delete this notification?
                    </p>
                </div>
            </Modal>

            {/* Clear All Notifications Modal */}
            <Modal
                isOpen={clearAllModalOpen}
                onClose={() => setClearAllModalOpen(false)}
                title="Clear All Notifications"
                maxWidth="max-w-md"
                actionButton={
                    <button
                        onClick={clearAllNotifications}
                        disabled={isDeleting}
                        className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${isDeleting ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isDeleting ? "Clearing..." : "Clear All"}
                    </button>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-darktext">
                        Are you sure you want to delete all notifications? This action cannot be undone.
                    </p>
                </div>
            </Modal>

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-darktext dark:hover:text-accent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="sm:hidden p-2 rounded-lg bg-white dark:bg-darkcard border border-gray-200 dark:border-darkborder"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-darkborder">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-darkborder">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-darktext flex items-center gap-3">
                                <Bell className="text-indigo-600 dark:text-accent" />
                                Notifications
                            </h1>

                            {/* Mobile menu */}
                            {showMobileMenu && (
                                <div className="sm:hidden flex flex-col gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={isMarkingRead || unreadCount === 0}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkborder hover:bg-gray-50 dark:hover:bg-darkbg transition-colors ${isMarkingRead || unreadCount === 0
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`}
                                    >
                                        {isMarkingRead ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        <span className="dark:text-darktext">Mark all read</span>
                                    </button>
                                    <button
                                        onClick={() => setClearAllModalOpen(true)}
                                        disabled={notifications.length === 0}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-darkborder hover:bg-gray-50 dark:hover:bg-darkbg transition-colors ${notifications.length === 0
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="dark:text-darktext">Clear All</span>
                                    </button>
                                </div>
                            )}

                            {/* Desktop buttons */}
                            <div className="hidden sm:flex gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    disabled={isMarkingRead || unreadCount === 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-darkborder hover:bg-gray-50 dark:hover:bg-darkbg transition-colors ${isMarkingRead || unreadCount === 0
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                >
                                    {isMarkingRead ? (
                                        <Loader2 className="w-4 h-4 animate-spin dark:text-darktext" />
                                    ) : (
                                        <Check className="w-4 h-4 dark:text-darktext" />
                                    )}
                                    <span className="dark:text-darktext">Mark all read</span>
                                </button>
                                <button
                                    onClick={() => setClearAllModalOpen(true)}
                                    disabled={notifications.length === 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-darkborder hover:bg-gray-50 dark:hover:bg-darkbg transition-colors ${notifications.length === 0
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                >
                                    <Trash2 className="w-4 h-4 dark:text-darktext" />
                                    <span className="dark:text-darktext">Clear All</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile dropdown for tabs */}
                        <div className="mt-4 sm:mt-6">
                            <div className="sm:hidden relative">
                                <select
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className="block w-full p-2 rounded-lg border border-gray-300 dark:border-darkborder bg-white dark:bg-darkcard text-gray-700 dark:text-darktext"
                                >
                                    {['all', 'unread', 'like', 'comment', 'follow'].map((tab) => (
                                        <option key={tab} value={tab}>
                                            {tab === 'all' && 'All Notifications'}
                                            {tab === 'unread' && 'Unread Only'}
                                            {tab === 'like' && 'Likes'}
                                            {tab === 'comment' && 'Comments'}
                                            {tab === 'follow' && 'Follows'}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Desktop tabs */}
                            <div className="hidden sm:flex gap-4 overflow-x-auto pb-2">
                                {['all', 'unread', 'like', 'comment', 'follow'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap px-4 py-2 text-sm rounded-full ${activeTab === tab
                                                ? "bg-indigo-600 text-white dark:bg-accent"
                                                : "bg-gray-100 text-gray-700 dark:bg-darkbg dark:text-darktext hover:bg-gray-200 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        {tab === 'all' && 'All'}
                                        {tab === 'unread' && 'Unread'}
                                        {tab === 'like' && 'Likes'}
                                        {tab === 'comment' && 'Comments'}
                                        {tab === 'follow' && 'Follows'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-darkborder">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="animate-spin text-indigo-600 dark:text-accent" size={32} />
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                                <BellOff className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mb-4" />
                                <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
                                    No notifications found
                                </h3>
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mt-1">
                                    {activeTab === "unread"
                                        ? "You don't have any unread notifications"
                                        : "You don't have any notifications in this category"}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-darkbg transition-colors cursor-pointer ${!notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                        }`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markSingleAsRead(notification._id);
                                        }
                                        if (notification.blog) {
                                            navigate(`/blog/${notification.blog.blogId}`);
                                        } else if (notification.sender) {
                                            navigate(`/@${notification.sender.username}`);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={notification.sender?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${notification.sender?.name || 'User'}&background=indigo`}
                                            alt={notification.sender?.name || 'User'}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 dark:border-darkborder"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-gray-800 dark:text-darktext">
                                                        <span className="font-medium">{notification.sender?.name || 'User'}</span>
                                                    </p>
                                                    {renderNotificationContent(notification)}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedNotification(notification);
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-darktext/70 mt-1">
                                                {smartFormatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                        <div className="mt-1">
                                            {!notification.isRead ? (
                                                <button
                                                    onClick={(e) => markSingleAsRead(notification._id, e)}
                                                    className="text-indigo-600 dark:text-accent p-1"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <Check className="h-4 w-4 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Notifications;