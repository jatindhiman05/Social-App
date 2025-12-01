import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    addSlectedBlog,
    changeLikes,
    removeSelectedBlog,
} from "../utils/selectedBlogSlice";
import Comment from "../components/Comment";
import { setIsOpen } from "../utils/commentSlice";
import { updateData } from "../utils/userSilce";
import { Bookmark, Heart, MessageCircle, Edit, Loader2, ArrowLeft, Trash2, X } from "lucide-react";
import Modal from "../components/Modal";

// Helper Functions
export async function handleSaveBlogs(id, token) {
    try {
        let res = await axios.patch(
            `${import.meta.env.VITE_BACKEND_URL}/save-blog/${id}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        toast.success(res.data.message);
        return res.data.saved;
    } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
        throw error;
    }
}

export async function handleFollowCreator(id, token, dispatch) {
    try {
        let res = await axios.patch(
            `${import.meta.env.VITE_BACKEND_URL}/follow/${id}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        toast.success(res.data.message);
        dispatch(updateData(["followers", id]));
        return res.data.following;
    } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
        throw error;
    }
}

function BlogPage() {
    const { id } = useParams();
    console.log(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { token, email, id: userId, profilePic, following } = useSelector(
        (state) => state.user
    );
    const { likes, comments, content } = useSelector(
        (state) => state.selectedBlog
    );
    const { isOpen } = useSelector((state) => state.comment);

    const [blogData, setBlogData] = useState(null);
    const [isBlogSaved, setIsBlogSaved] = useState(false);
    const [isLike, setIsLike] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function fetchBlogById() {
        setIsLoading(true);
        try {
            let {
                data: { blog },
            } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/${id}`
            );
            setBlogData(blog);
            setIsBlogSaved(blog?.totalSaves?.includes(userId));
            setIsFollowing(following?.includes(blog?.creator?._id));
            dispatch(addSlectedBlog(blog));

            if (blog.likes.includes(userId)) {
                setIsLike(true);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLike() {
        if (!token) {
            return toast.error("Please sign in to like this blog");
        }

        const originalIsLike = isLike;
        setIsLike((prev) => !prev);

        try {
            let res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/like/${blogData._id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            dispatch(changeLikes(userId));
            toast.success(res.data.message);
        } catch (error) {
            setIsLike(originalIsLike);
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    }

    async function handleSave() {
        if (!token) {
            return toast.error("Please sign in to save this blog");
        }

        const originalIsSaved = isBlogSaved;
        setIsBlogSaved((prev) => !prev);

        try {
            const saved = await handleSaveBlogs(blogData?._id, token);
            setIsBlogSaved(saved);
        } catch (error) {
            setIsBlogSaved(originalIsSaved);
        }
    }

    async function handleFollow() {
        if (!token) {
            return toast.error("Please sign in to follow this creator");
        }

        const originalIsFollowing = isFollowing;
        setIsFollowing((prev) => !prev);

        try {
            const following = await handleFollowCreator(
                blogData?.creator?._id,
                token,
                dispatch
            );
            setIsFollowing(following);
        } catch (error) {
            setIsFollowing(originalIsFollowing);
        }
    }


    async function handleDeleteBlog() {
        if (!token) {
            return toast.error("Please sign in to delete this blog");
        }

        setIsDeleting(true);
        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/${blogData._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success("Blog deleted successfully");
            navigate("/"); // Redirect to home after deletion
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete blog");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    }


    useEffect(() => {
        fetchBlogById();

        return () => {
            dispatch(setIsOpen(false));
            if (
                window.location.pathname !== `/edit/${id}` &&
                window.location.pathname !== `/blog/${id}`
            ) {
                dispatch(removeSelectedBlog());
            }
        };
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-darkbg">
                <Loader2 className="animate-spin w-12 h-12 text-indigo-600 dark:text-accent" />
            </div>
        );
    }

    if (!blogData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-darkbg">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-darktext mb-2">Blog not found</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-indigo-600 dark:text-accent hover:text-indigo-800 dark:hover:text-accent/80"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative bg-gray-50 dark:bg-darkbg">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 dark:text-darktext/80 hover:text-gray-900 dark:hover:text-accent mb-8"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            <article className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden  border-gray-200 dark:border-darkborder">
                {/* Blog Header */}
                <div className="p-6 sm:p-8">
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-darktext leading-tight mb-6">
                        {blogData.title}
                    </h1>

                    {/* Featured Image */}
                    {blogData?.image && (
                        <div className="mb-8 rounded-lg overflow-hidden  border-gray-200 dark:border-darkborder">
                            <img
                                src={blogData?.image}
                                alt="Blog"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}

                    {/* Author Info */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-6">
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/@${blogData?.creator?.username || ""}`}
                                className="hover:opacity-90 transition-opacity"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden  border-white dark:border-darkbg shadow-md">
                                    <img
                                        src={
                                            blogData?.creator?.profilePic
                                                ? blogData?.creator?.profilePic
                                                : `https://api.dicebear.com/9.x/initials/svg?seed=${blogData?.creator?.name || "User"}`
                                        }
                                        alt="Creator"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </Link>

                            <div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={`/@${blogData?.creator?.username || ""}`}
                                        className="text-lg font-semibold text-gray-900 dark:text-darktext hover:text-indigo-600 dark:hover:text-accent hover:underline"
                                    >
                                        {blogData?.creator?.name || "Unknown"}
                                    </Link>

                                    {userId !== blogData?.creator?._id && (
                                        <button
                                            onClick={handleFollow}
                                            className={`px-3 py-1 text-sm rounded-full ${isFollowing
                                                ? "bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-darktext hover:bg-gray-200 dark:hover:bg-darkborder"
                                                : "bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
                                                } transition-colors`}
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </div>
                                <div className="text-gray-500 dark:text-darktext/70 text-sm mt-1">
                                    <span>{Math.ceil(blogData.content.blocks.length / 5)} min read</span>
                                </div>
                            </div>
                        </div>

                        {token && email === blogData?.creator?.email && (
                            <div className="flex gap-3">
                                <Link
                                    to={`/edit/${blogData?.blogId}`}
                                    className="flex items-center gap-2 bg-indigo-600 dark:bg-accent hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Blog Content */}
                <div className="px-6 sm:px-8 pb-8 ">
                    <div className="prose prose-lg max-w-none text-gray-700 dark:text-darktext/80">
                        {content?.blocks?.map((block, index) => {
                            if (block.type === "header") {
                                const HeaderTag = `h${block.data.level}`;
                                return (
                                    <HeaderTag
                                        key={index}
                                        className="text-gray-900 dark:text-darktext"
                                        dangerouslySetInnerHTML={{
                                            __html: block.data.text,
                                        }}
                                    />
                                );
                            }

                            if (block.type === "paragraph") {
                                return (
                                    <p
                                        key={index}
                                        className="leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: block.data.text,
                                        }}
                                    />
                                );
                            }

                            if (block.type === "image") {
                                return (
                                    <figure key={index} className="my-6">
                                        <img
                                            src={block.data.file.url}
                                            alt="Block"
                                            className="rounded-lg shadow-md w-full border-gray-200 dark:border-darkborder"
                                        />
                                        {block.data.caption && (
                                            <figcaption className="text-center text-gray-500 dark:text-darktext/70 text-sm mt-2">
                                                {block.data.caption}
                                            </figcaption>
                                        )}
                                    </figure>
                                );
                            }

                            if (block.type === "list") {
                                const ListTag = block.data.style === "ordered" ? "ol" : "ul";
                                return (
                                    <ListTag
                                        key={index}
                                        className={
                                            block.data.style === "ordered"
                                                ? "list-decimal pl-8 my-4 space-y-2"
                                                : "list-disc pl-8 my-4 space-y-2"
                                        }
                                    >
                                        {block.data.items.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="leading-relaxed"
                                                dangerouslySetInnerHTML={{
                                                    __html: item,
                                                }}
                                            />
                                        ))}
                                    </ListTag>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>

                {/* Action Bar */}
                <div className=" border-gray-200 dark:border-darkborder px-6 sm:px-8 py-4 bg-gray-50 dark:bg-darkbg">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-6">
                            {/* Like Button */}
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 ${isLike ? "text-indigo-600 dark:text-accent" : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent"} transition-colors`}
                            >
                                <Heart className={`w-5 h-5 ${isLike ? "fill-current" : ""}`} />
                                <span>{likes?.length || 0}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                                onClick={() => dispatch(setIsOpen())}
                                className="flex items-center gap-2 text-gray-600 dark:text-darktext/80 hover:text-green-600 dark:hover:text-accent transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>{comments?.length || 0}</span>
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-2 ${isBlogSaved ? "text-indigo-600 dark:text-accent" : "text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent"} transition-colors`}
                        >
                            <Bookmark className={`w-5 h-5 ${isBlogSaved ? "fill-current" : ""}`} />
                            <span className="hidden sm:inline">{isBlogSaved ? "Saved" : "Save"}</span>
                        </button>
                    </div>
                </div>
            </article>

            {/* Comment Section */}
            {isOpen && <Comment blogId={blogData?._id} isOpen={isOpen} />}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Blog"
                cancelButtonText="Cancel"
                actionButton={
                    <button
                        onClick={handleDeleteBlog}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[80px]"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </button>
                }
            >
                <p className="text-gray-600 dark:text-darktext/80">
                    Are you sure you want to delete this blog? This action cannot be undone.
                </p>
            </Modal>

        </div>
    );
}

export default BlogPage;