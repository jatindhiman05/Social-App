import React, { useState } from "react";
import { useSelector } from "react-redux";
import usePagination from "../hooks/usePagination";
import { Link } from "react-router-dom";
import { Loader2, ChevronDown, ArrowRight, Settings, HelpCircle, Hash, Mail } from "lucide-react";
import { formatDate } from "../utils/formatDate";
import {
    FaRegHeart,
    FaHeart,
    FaRegCommentDots,
    FaRegBookmark,
    FaBookmark,
    FaInstagram,
    FaTwitter,
    FaFacebook,
    FaYoutube,
} from "react-icons/fa";

function HomePage() {
    const [page, setPage] = useState(1);
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { token, id: userId } = useSelector((state) => state.user);
    const { blogs, hasMore, isLoading: isBlogsLoading } = usePagination("blogs", {}, 4, page);

    const topics = [
        "React",
        "Node.js",
        "MERN",
        "Express",
        "JavaScript",
        "Algorithms",
        "Frontend",
        "Backend",
        "Fullstack",
        "Database"
    ];

    const handleSubscribe = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubscribed(true);
            setIsLoading(false);
            setEmail("");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Start Writing button */}
                <div className="mb-14 text-center px-4 mt-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-darktext mb-3">
                        Discover & Share{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-accent dark:to-indigo-400 bg-clip-text text-transparent">
                            Knowledge
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-darktext/80 max-w-2xl mx-auto mb-4">
                        Explore insightful articles, tutorials, and stories from the developer community.
                    </p>
                    <Link
                        to={token ? "/add-blog" : "/signin"}
                        className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                    >
                        Start Writing
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content Area */}
                    <div className="w-full lg:w-2/3">
                        {!isBlogsLoading && blogs.length > 0 ? (
                            <div className="space-y-5">
                                {blogs.map((blog) => (
                                    <div
                                        key={blog._id}
                                        className="bg-white dark:bg-darkcard rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200  border-gray-100 dark:border-darkborder"
                                    >
                                        <Link to={`/blog/${blog.blogId}`} className="block group">
                                            <div className="flex flex-col sm:flex-row h-full">
                                                {/* Image */}
                                                {blog.image && (
                                                    <div className="sm:w-2/5 overflow-hidden">
                                                        <img
                                                            src={blog.image}
                                                            alt={blog.title}
                                                            className="w-full h-44 sm:h-60 object-fill transition-transform duration-200 group-hover:scale-[1.02]"
                                                        />
                                                    </div>
                                                )}

                                                {/* Blog Content */}
                                                <div className={`p-4 sm:p-4 ${blog.image ? 'sm:w-3/5' : 'w-full'}`}>
                                                    {/* Creator */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Link
                                                            to={`/@${blog.creator?.username || 'unknown'}`}
                                                            className="hover:opacity-80 transition-opacity"
                                                        >
                                                            <img
                                                                src={
                                                                    blog?.creator?.profilePic
                                                                        ? blog.creator.profilePic
                                                                        : `https://api.dicebear.com/7.x/initials/svg?seed=${blog?.creator?.name}`
                                                                }
                                                                alt={blog?.creator?.name || 'Unknown Creator'}
                                                                className="w-8 h-8 rounded-full object-cover  border-white dark:border-darkcard shadow-xs"
                                                            />
                                                        </Link>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-darktext line-clamp-1">
                                                                {blog?.creator?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-darktext/70">
                                                                {Math.ceil(blog.content.blocks.length / 5)} min read
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Title & Description */}
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-darktext mb-2 group-hover:text-indigo-600 dark:group-hover:text-accent transition-colors line-clamp-2">
                                                        {blog.title}
                                                    </h2>
                                                    <p className="text-sm text-gray-600 dark:text-darktext/80 line-clamp-2 mb-3">
                                                        {blog.description}
                                                    </p>

                                                    {/* Tags */}
                                                    {blog.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            {blog?.tags.slice(0, 2).map((tag, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-2 py-1 bg-indigo-50 dark:bg-darkbg text-indigo-700 dark:text-accent text-xs rounded-md"
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Meta Info */}
                                                    <div className="flex items-center gap-3 mt-2 pt-2  border-gray-100 dark:border-darkborder text-xs sm:text-sm">
                                                        <span className="flex items-center gap-1 text-gray-500 dark:text-darktext/70 hover:text-gray-700 dark:hover:text-darktext transition-colors">
                                                            {blog.likes.includes(userId) ? (
                                                                <FaHeart className="text-red-500 dark:text-accent text-sm" />
                                                            ) : (
                                                                <FaRegHeart className="text-sm" />
                                                            )}
                                                            {blog?.likes?.length}
                                                        </span>

                                                        <span className="flex items-center gap-1 text-gray-500 dark:text-darktext/70 hover:text-gray-700 dark:hover:text-darktext transition-colors">
                                                            <FaRegCommentDots className="text-sm" />
                                                            {blog?.comments?.length}
                                                        </span>

                                                        <span className="flex items-center gap-1 text-gray-500 dark:text-darktext/70 hover:text-gray-700 dark:hover:text-darktext transition-colors">
                                                            {blog?.totalSaves.includes(userId) ? (
                                                                <FaBookmark className="text-indigo-500 dark:text-accent text-sm" />
                                                            ) : (
                                                                <FaRegBookmark className="text-sm" />
                                                            )}
                                                            {blog?.totalSaves?.length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="flex justify-center mt-6">
                                        <button
                                            onClick={() => setPage((prev) => prev + 1)}
                                            className="flex items-center gap-2 rounded-lg  border-gray-200 dark:border-darkborder bg-white dark:bg-darkcard px-5 py-2 text-sm font-medium text-gray-700 dark:text-darktext hover:border-indigo-500 dark:hover:border-accent hover:bg-indigo-50 dark:hover:bg-darkbg hover:text-indigo-600 dark:hover:text-accent transition-all duration-200"
                                            disabled={isBlogsLoading}
                                        >
                                            {isBlogsLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin w-4 h-4 text-indigo-600 dark:text-accent" />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    Load More
                                                    <ChevronDown className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : isBlogsLoading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="animate-spin w-10 h-10 text-indigo-600 dark:text-accent" />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-darkcard rounded-md  border-gray-200 dark:border-darkborder p-6 text-center">
                                <div className="max-w-md mx-auto">
                                    <p className="text-gray-600 dark:text-darktext/80 mb-4">
                                        No Blogs Found. Start Writing 😃
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-1/3 space-y-5">
                        {/* Topics Section */}
                        <div className="bg-white dark:bg-darkcard rounded-lg  border-gray-200 dark:border-darkborder p-4 shadow-sm hover:shadow transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-indigo-600 dark:text-accent" />
                                    Popular Topics
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {topics.map((tag, index) => (
                                    <Link
                                        key={index}
                                        to={`/tag/${tag}`}
                                        className="bg-gray-50 dark:bg-darkbg hover:bg-indigo-50 dark:hover:bg-darkborder text-gray-700 dark:text-darktext hover:text-indigo-600 dark:hover:text-accent px-2.5 py-1 rounded text-xs font-medium border border-gray-200 dark:border-darkborder hover:border-indigo-300 dark:hover:border-accent transition-all"
                                    >
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* About Widget */}
                        <div className="bg-white dark:bg-darkcard rounded-lg  border-gray-200 dark:border-darkborder p-4 shadow-sm hover:shadow transition-shadow">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext mb-2 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-accent" />
                                About Us
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-darktext/80 mb-3">
                                Welcome to our blogging platform where we share insights,
                                tutorials, and stories about web development and technology.
                            </p>
                            <div className="space-y-2">
                                <Link
                                    to="/about"
                                    className="inline-flex items-center text-indigo-600 dark:text-accent hover:text-indigo-700 dark:hover:text-accent/80 text-xs font-medium group"
                                >
                                    Learn more about us
                                    <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Subscription */}
                <div className="mt-16 bg-white dark:bg-darkcard rounded-lg border-gray-200 dark:border-darkborder p-8 shadow-sm">
                    <div className="text-center">
                        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-darktext mb-3">
                            Never Miss a{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-accent dark:to-indigo-400 bg-clip-text text-transparent">
                                Blog
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-darktext/80 mb-6 max-w-md mx-auto">
                            Subscribe to get the latest blog, new tech, and exclusive news.
                        </p>

                        {isSubscribed ? (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-sm">
                                Thanks for subscribing! You'll hear from us soon.
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubscribe}
                                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email id"
                                    className="flex-1 px-4 py-3 text-base rounded-md border border-gray-300 dark:border-darkborder bg-white dark:bg-darkbg text-gray-900 dark:text-darktext focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-5 py-3 text-base bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-indigo-500 text-white rounded-md transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                            Subscribing...
                                        </span>
                                    ) : (
                                        "Subscribe"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>



                {/* Footer */}
                <footer className="mt-16 bg-white dark:bg-darkcard rounded-lg border-gray-200 dark:border-darkborder pt-6 pb-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* Brand Info */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-darktext">JD Journal</h3>
                                <p className="text-sm text-gray-600 dark:text-darktext/80">
                                    A platform for sharing knowledge and ideas. Join our community of writers and readers.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-darktext/80">
                                    <Mail className="h-4 w-4" />
                                    <span>jatin121dhiman@gmail.com</span>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="space-y-2">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-darktext">Explore</h4>
                                <ul className="space-y-2">
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Home</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">All Blogs</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Top Writers</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Popular Posts</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Browse Tags</Link></li>
                                </ul>
                            </div>

                            {/* For Writers */}
                            <div className="space-y-2">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-darktext">For Writers</h4>
                                <ul className="space-y-2">
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Start Writing</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Writing Guidelines</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Join Community</Link></li>
                                    <li><Link to="/" className="text-sm text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">Monetization</Link></li>
                                </ul>
                            </div>

                            {/* Connect With Us */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-darktext mb-2">Connect</h4>
                                    <div className="flex space-x-3">
                                        <a href="#" aria-label="Twitter" className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">
                                            <FaTwitter className="h-5 w-5" />
                                        </a>
                                        <a href="#" aria-label="GitHub" className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                        <a href="#" aria-label="Discord" className="text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent transition-colors">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Copyright and Legal */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-darkborder flex flex-col md:flex-row justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-darktext/70 mb-2 md:mb-0">
                                © {new Date().getFullYear()} JD Journal. All rights reserved.
                            </p>
                            <div className="flex space-x-4">
                                <Link to="/" className="text-sm text-gray-500 dark:text-darktext/70 hover:text-indigo-600 dark:hover:text-accent transition-colors">Privacy</Link>
                                <Link to="/" className="text-sm text-gray-500 dark:text-darktext/70 hover:text-indigo-600 dark:hover:text-accent transition-colors">Terms</Link>
                                <Link to="/" className="text-sm text-gray-500 dark:text-darktext/70 hover:text-indigo-600 dark:hover:text-accent transition-colors">Cookies</Link>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}

export default HomePage;