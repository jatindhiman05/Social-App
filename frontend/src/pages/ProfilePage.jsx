import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { handleFollowCreator } from "./BlogPage";
import { useSelector, useDispatch } from "react-redux";
import DisplayBlogs from "../components/DisplayBlogs";
import { Bookmark, Heart, Home, PenSquare, UserPlus, Users, Calendar, Clock, FileText, BookOpen, ChevronRight, MoreHorizontal, ArrowLeft, User, X } from "lucide-react";
import Modal from "../components/Modal";
import { logout } from "../utils/userSilce";

function ProfilePage() {
    const { username } = useParams();
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { token, id: userId, following } = useSelector((state) => state.user);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [followLoading, setFollowLoading] = useState(false);
    const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
    const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

    function renderComponent() {
        if (location.pathname === `/${username}`) {
            return (
                <DisplayBlogs blogs={userData.blogs.filter((blog) => !blog.draft)} />
            );
        } else if (location.pathname === `/${username}/saved-blogs`) {
            return (
                <>
                    {userData.showSavedBlogs || userData._id === userId ? (
                        <DisplayBlogs blogs={userData.saveBlogs} />
                    ) : (
                        <Navigate to={`/${username}`} />
                    )}
                </>
            );
        } else if (location.pathname === `/${username}/draft-blogs`) {
            return (
                <>
                    {userData._id === userId ? (
                        <DisplayBlogs blogs={userData.blogs.filter((blog) => blog.draft)} />
                    ) : (
                        <Navigate to={`/${username}`} />
                    )}
                </>
            );
        } else {
            return (
                <>
                    {userData.showLikedBlogs || userData._id === userId ? (
                        <DisplayBlogs blogs={userData.likeBlogs} />
                    ) : (
                        <Navigate to={`/${username}`} />
                    )}
                </>
            );
        }
    }

    useEffect(() => {
        async function fetchUserDetails() {
            try {
                setIsLoading(true);
                let res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/users/${username.split("@")[1]}`
                );
                setUserData(res.data.user);
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to load profile");
            } finally {
                setIsLoading(false);
            }
        }
        fetchUserDetails();
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-darkbg">
                <div className="py-12 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto animate-pulse">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-darkcard"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-8 w-64 bg-gray-100 dark:bg-darkcard rounded"></div>
                                <div className="h-4 w-32 bg-gray-100 dark:bg-darkcard rounded"></div>
                                <div className="h-4 w-48 bg-gray-100 dark:bg-darkcard rounded"></div>
                                <div className="flex gap-4">
                                    <div className="h-4 w-24 bg-gray-100 dark:bg-darkcard rounded"></div>
                                    <div className="h-4 w-24 bg-gray-100 dark:bg-darkcard rounded"></div>
                                </div>
                                <div className="h-10 w-32 bg-gray-100 dark:bg-darkcard rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!userData) {
        setTimeout(() => {
            dispatch(logout());
            navigate('/');
            window.location.reload();
        }, 1000);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex flex-col items-center justify-center px-4">
                <div className="text-center max-w-md p-8 bg-white dark:bg-darkcard rounded-xl shadow-lg border border-gray-200 dark:border-darkborder">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-darktext mb-4">User not found</h2>
                    <p className="text-gray-600 dark:text-darktext/70 mb-6">The profile you're looking for doesn't exist or may have been removed.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 dark:bg-accent text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors shadow-md"
                    >
                        Return to home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg">
            {/* Profile Header */}
            <div className="bg-white dark:bg-darkcard py-12 px-4 sm:px-6 shadow-sm border-b border-gray-200 dark:border-darkborder">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white dark:border-darkbg shadow-lg bg-gray-100 dark:bg-darkcard">
                                <img
                                    src={
                                        userData.profilePic
                                            ? userData.profilePic
                                            : `https://api.dicebear.com/9.x/initials/svg?seed=${userData.name}`
                                    }
                                    alt={userData.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {userData._id === userId && (
                                <Link
                                    to="/edit-profile"
                                    className="absolute -bottom-2 -right-2 bg-white dark:bg-darkcard text-indigo-600 dark:text-accent p-2 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-darkbg transition-colors border border-gray-200 dark:border-darkborder hover:shadow-lg"
                                >
                                    <PenSquare className="w-5 h-5" />
                                </Link>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-darktext">{userData.name}</h1>
                                <p className="text-gray-500 dark:text-darktext/70">@{username.split("@")[1]}</p>
                            </div>

                            {userData.bio && (
                                <p className="text-gray-600 dark:text-darktext/80 max-w-lg mx-auto md:mx-0">{userData.bio}</p>
                            )}

                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                <button
                                    onClick={() => setIsFollowersModalOpen(true)}
                                    className="flex items-center gap-2 text-gray-700 dark:text-darktext/80 bg-gray-50 dark:bg-darkbg px-3 py-1.5 rounded-full border border-gray-200 dark:border-darkborder hover:bg-gray-100 dark:hover:bg-darkborder cursor-pointer"
                                >
                                    <Users className="w-4 h-4 text-indigo-500 dark:text-accent" />
                                    <span className="text-sm">
                                        <span className="font-medium">{userData.followers.length}</span> followers
                                    </span>
                                </button>
                                <button
                                    onClick={() => setIsFollowingModalOpen(true)}
                                    className="flex items-center gap-2 text-gray-700 dark:text-darktext/80 bg-gray-50 dark:bg-darkbg px-3 py-1.5 rounded-full border border-gray-200 dark:border-darkborder hover:bg-gray-100 dark:hover:bg-darkborder cursor-pointer"
                                >
                                    <UserPlus className="w-4 h-4 text-indigo-500 dark:text-accent" />
                                    <span className="text-sm">
                                        <span className="font-medium">{userData.following.length}</span> following
                                    </span>
                                </button>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-darktext/80 bg-gray-50 dark:bg-darkbg px-3 py-1.5 rounded-full border border-gray-200 dark:border-darkborder">
                                    <BookOpen className="w-4 h-4 text-indigo-500 dark:text-accent" />
                                    <span className="text-sm">
                                        <span className="font-medium">{userData.blogs.filter(blog => !blog.draft).length}</span> posts
                                    </span>
                                </div>
                            </div>

                            {userId !== userData._id && (
                                <div className="flex gap-3 justify-center md:justify-start">
                                    <button
                                        onClick={async () => {
                                            if (followLoading) return;
                                            setFollowLoading(true);
                                            const followed = await handleFollowCreator(userData._id, token, dispatch, userId);
                                            if (followed === true) {
                                                setUserData((prev) => ({
                                                    ...prev,
                                                    followers: [...prev.followers, userId],
                                                }));
                                            } else if (followed === false) {
                                                setUserData((prev) => ({
                                                    ...prev,
                                                    followers: prev.followers.filter((id) => id !== userId),
                                                }));
                                            }
                                            setFollowLoading(false);
                                        }}
                                        disabled={followLoading}
                                        className={`mt-2 px-6 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 mx-auto md:mx-0 transition-all shadow-sm hover:shadow-md
                                            ${followLoading ? "opacity-90 cursor-not-allowed" : ""}
                                            ${following.includes(userData._id)
                                                ? "bg-indigo-50 dark:bg-darkbg text-indigo-700 dark:text-accent hover:bg-indigo-100 dark:hover:bg-darkborder border border-indigo-100 dark:border-darkborder"
                                                : "bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
                                            }`}
                                    >
                                        {followLoading ? (
                                            <div className="flex items-center gap-2">
                                                <svg
                                                    className={`w-4 h-4 ${following.includes(userData._id) ? "text-indigo-600 dark:text-accent" : "text-white"}`}
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                                                        opacity=".25"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
                                                        fill="currentColor"
                                                        className="origin-center animate-spin"
                                                        style={{ animationDuration: "1s" }}
                                                    />
                                                </svg>
                                                <span>Processing...</span>
                                            </div>
                                        ) : following.includes(userData._id) ? "Following" : "Follow"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Navigation Tabs */}
                        <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200 dark:border-darkborder">
                            <nav className="flex overflow-x-auto">
                                <Link
                                    to={`/${username}`}
                                    className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${location.pathname === `/${username}`
                                        ? "text-indigo-600 dark:text-accent border-b-2 border-indigo-600 dark:border-accent font-medium"
                                        : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent hover:bg-gray-50 dark:hover:bg-darkbg"
                                        }`}
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Blogs</span>
                                </Link>

                                {(userData.showSavedBlogs || userData._id === userId) && (
                                    <Link
                                        to={`/${username}/saved-blogs`}
                                        className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${location.pathname === `/${username}/saved-blogs`
                                            ? "text-indigo-600 dark:text-accent border-b-2 border-indigo-600 dark:border-accent font-medium"
                                            : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent hover:bg-gray-50 dark:hover:bg-darkbg"
                                            }`}
                                    >
                                        <Bookmark className="w-5 h-5" />
                                        <span>Saved</span>
                                    </Link>
                                )}

                                {(userData.showLikedBlogs || userData._id === userId) && (
                                    <Link
                                        to={`/${username}/liked-blogs`}
                                        className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${location.pathname === `/${username}/liked-blogs`
                                            ? "text-indigo-600 dark:text-accent border-b-2 border-indigo-600 dark:border-accent font-medium"
                                            : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent hover:bg-gray-50 dark:hover:bg-darkbg"
                                            }`}
                                    >
                                        <Heart className="w-5 h-5" />
                                        <span>Liked</span>
                                    </Link>
                                )}

                                {userData._id === userId && (
                                    <Link
                                        to={`/${username}/draft-blogs`}
                                        className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${location.pathname === `/${username}/draft-blogs`
                                            ? "text-indigo-600 dark:text-accent border-b-2 border-indigo-600 dark:border-accent font-medium"
                                            : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent hover:bg-gray-50 dark:hover:bg-darkbg"
                                            }`}
                                    >
                                        <FileText className="w-5 h-5" />
                                        <span>Drafts</span>
                                    </Link>
                                )}
                            </nav>
                        </div>

                        {/* Content Section */}
                        <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm border border-gray-200 dark:border-darkborder overflow-hidden">
                            {renderComponent()}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        {/* Stats Section */}
                        <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-darkborder">
                            <div className="p-6 border-b border-gray-200 dark:border-darkborder">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-accent" />
                                    <span>Activity Stats</span>
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <div className="bg-indigo-50/50 dark:bg-darkbg p-4 rounded-lg border border-indigo-100 dark:border-darkborder hover:border-indigo-200 dark:hover:border-accent transition-colors">
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-accent">{userData.blogs.filter(blog => !blog.draft).length}</p>
                                    <p className="text-sm text-gray-600 dark:text-darktext/70">Published</p>
                                </div>
                                {userData._id === userId && (
                                    <div className="bg-purple-50/50 dark:bg-darkbg p-4 rounded-lg border border-purple-100 dark:border-darkborder hover:border-purple-200 dark:hover:border-purple-500 transition-colors">
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userData.blogs.filter(blog => blog.draft).length}</p>
                                        <p className="text-sm text-gray-600 dark:text-darktext/70">Drafts</p>
                                    </div>
                                )}
                                <div className="bg-green-50/50 dark:bg-darkbg p-4 rounded-lg border border-green-100 dark:border-darkborder hover:border-green-200 dark:hover:border-green-500 transition-colors">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userData.likeBlogs.length}</p>
                                    <p className="text-sm text-gray-600 dark:text-darktext/70">Liked</p>
                                </div>
                                <div className="bg-yellow-50/50 dark:bg-darkbg p-4 rounded-lg border border-yellow-100 dark:border-darkborder hover:border-yellow-200 dark:hover:border-yellow-500 transition-colors">
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{userData.saveBlogs.length}</p>
                                    <p className="text-sm text-gray-600 dark:text-darktext/70">Saved</p>
                                </div>
                            </div>
                        </div>

                        {/* Following Section */}
                        <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-darkborder">
                            <div className="p-6 border-b border-gray-200 dark:border-darkborder">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600 dark:text-accent" />
                                    <span>Following</span>
                                </h2>
                            </div>
                            <div className="p-6">
                                {userData.following.length > 0 ? (
                                    <div className="space-y-3">
                                        {userData.following.slice(0, 5).map((user) => (
                                            <Link
                                                key={user._id}
                                                to={`/@${user.username}`}
                                                className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-darkbg rounded-lg transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-darkcard border border-gray-200 dark:border-darkborder">
                                                        <img
                                                            src={
                                                                user.profilePic
                                                                    ? user.profilePic
                                                                    : `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                                                            }
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-darktext group-hover:text-indigo-600 dark:group-hover:text-accent">{user.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-darktext/70">@{user.username}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-darktext/70 group-hover:text-indigo-600 dark:group-hover:text-accent" />
                                            </Link>
                                        ))}
                                        {userData.following.length > 5 && (
                                            <button
                                                onClick={() => setIsFollowingModalOpen(true)}
                                                className="text-indigo-600 dark:text-accent hover:text-indigo-800 dark:hover:text-accent/80 text-sm font-medium inline-flex items-center gap-1 mt-2"
                                            >
                                                View all ({userData.following.length})
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-darktext/70 text-sm">Not following anyone yet</p>
                                )}
                            </div>
                        </div>

                        {/* Member Since */}
                        <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-darkborder">
                            <div className="p-6 border-b border-gray-200 dark:border-darkborder">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-accent" />
                                    <span>Member Since</span>
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-darktext/80">
                                    <Calendar className="w-5 h-5 text-gray-400 dark:text-darktext/70" />
                                    <span>
                                        {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Followers Modal */}
            <Modal
                isOpen={isFollowersModalOpen}
                onClose={() => setIsFollowersModalOpen(false)}
                title="Followers"
                maxWidth="max-w-md"
            >
                <div className="max-h-[400px] overflow-y-auto">
                    {userData.followers.length > 0 ? (
                        <div className="space-y-3">
                            {userData.followers.map((user) => (
                                <Link
                                    key={user._id}
                                    to={`/@${user.username}`}
                                    onClick={() => setIsFollowersModalOpen(false)}
                                    className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-darkbg rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-darkcard border border-gray-200 dark:border-darkborder">
                                            <img
                                                src={
                                                    user.profilePic
                                                        ? user.profilePic
                                                        : `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                                                }
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-darktext group-hover:text-indigo-600 dark:group-hover:text-accent">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-darktext/70">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </div>
                                    {user._id === userId && (
                                        <span className="text-xs bg-indigo-100 dark:bg-darkborder text-indigo-800 dark:text-accent px-2 py-1 rounded-full">
                                            You
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-darkborder rounded-full mb-4">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-darktext/70">
                                No followers yet
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Following Modal */}
            <Modal
                isOpen={isFollowingModalOpen}
                onClose={() => setIsFollowingModalOpen(false)}
                title="Following"
                maxWidth="max-w-md"
            >
                <div className="max-h-[400px] overflow-y-auto">
                    {userData.following.length > 0 ? (
                        <div className="space-y-3">
                            {userData.following.map((user) => (
                                <Link
                                    key={user._id}
                                    to={`/@${user.username}`}
                                    onClick={() => setIsFollowingModalOpen(false)}
                                    className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-darkbg rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-darkcard border border-gray-200 dark:border-darkborder">
                                            <img
                                                src={
                                                    user.profilePic
                                                        ? user.profilePic
                                                        : `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                                                }
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-darktext group-hover:text-indigo-600 dark:group-hover:text-accent">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-darktext/70">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </div>
                                    {user._id === userId && (
                                        <span className="text-xs bg-indigo-100 dark:bg-darkborder text-indigo-800 dark:text-accent px-2 py-1 rounded-full">
                                            You
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-darkborder rounded-full mb-4">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-darktext/70">
                                Not following anyone yet
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default ProfilePage;