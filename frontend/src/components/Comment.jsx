import { useDispatch, useSelector } from "react-redux";
import { setIsOpen } from "../utils/commentSlice";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    deleteCommentAndReply,
    setCommentLikes,
    setComments,
    setReplies,
    setUpdatedComments,
} from "../utils/selectedBlogSlice";
import { formatDate, smartFormatDate } from "../utils/formatDate";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    X,
    MoreVertical,
    ThumbsUp,
    MessageCircle,
    Edit,
    Trash2,
    ArrowLeft,
    Send,
    ChevronDown,
    Loader2
} from "lucide-react";
import Modal from "./Modal";

function Comment({ blogId, isOpen }) {
    const dispatch = useDispatch();
    const [comment, setComment] = useState("");
    const [activeReply, setActiveReply] = useState(null);
    const [currentPopup, setCurrentPopup] = useState(null);
    const [currentEditComment, setCurrentEditComment] = useState(null);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const sidebarRef = useRef(null);

    const {
        _id: blogIdFromStore,
        comments,
        creator: { _id: creatorId },
    } = useSelector((state) => state.selectedBlog);

    const { token, id: userId } = useSelector((state) => state.user);

    // Handle click outside the sidebar
    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                dispatch(setIsOpen(false));
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, dispatch]);

    async function handleComment() {
        if (!comment.trim()) return;

        try {
            setIsPosting(true);
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/comment/${blogId || blogIdFromStore}`,
                { comment },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setComment("");
            dispatch(setComments(res.data.newComment));
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setIsPosting(false);
        }
    }

    async function handleCommentDelete(id) {
        setIsDeleting(true);
        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/comment/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            dispatch(deleteCommentAndReply(id));
            setCommentToDelete(null);
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div
            ref={sidebarRef}
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-darkbg shadow-xl z-50 flex flex-col  border-gray-200 dark:border-darkborder"
        >
            {/* Header */}
            <div className=" border-gray-200 dark:border-darkborder p-4 flex items-center justify-between bg-white dark:bg-darkcard sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => dispatch(setIsOpen(false))}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-darkbg text-gray-600 dark:text-darktext/80"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-darktext">
                        Comments ({comments.length})
                    </h1>
                </div>
            </div>

            {/* Comment Input */}
            <div className="p-4  border-gray-200 dark:border-darkborder">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        {/* Profile picture would go here */}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={comment}
                            placeholder="Write a comment..."
                            className="w-full min-h-[80px] p-3 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent resize-none bg-white dark:bg-darkcard text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment();
                                }
                            }}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleComment}
                                disabled={!comment.trim() || isPosting}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${comment.trim() && !isPosting ? 'bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500' : 'bg-gray-200 dark:bg-darkbg text-gray-500 dark:text-darktext/70 cursor-not-allowed'}`}
                            >
                                {isPosting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Post
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-darktext/70">
                        <MessageCircle size={48} className="mb-4 text-gray-300 dark:text-darkborder" />
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to comment</p>
                    </div>
                ) : (
                    <DisplayComments
                        comments={comments}
                        userId={userId}
                        blogId={blogId || blogIdFromStore}
                        token={token}
                        activeReply={activeReply}
                        setActiveReply={setActiveReply}
                        currentPopup={currentPopup}
                        setCurrentPopup={setCurrentPopup}
                        currentEditComment={currentEditComment}
                        setCurrentEditComment={setCurrentEditComment}
                        creatorId={creatorId}
                        setCommentToDelete={setCommentToDelete}
                    />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!commentToDelete}
                onClose={() => setCommentToDelete(null)}
                title="Delete Comment"
                cancelButtonText="Cancel"
                actionButton={
                    <button
                        onClick={() => handleCommentDelete(commentToDelete)}
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
                    Are you sure you want to delete this comment? This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}

function DisplayComments({
    comments,
    userId,
    blogId,
    token,
    setActiveReply,
    activeReply,
    currentPopup,
    setCurrentPopup,
    currentEditComment,
    setCurrentEditComment,
    creatorId,
    setCommentToDelete,
}) {
    const [reply, setReply] = useState("");
    const [updatedCommentContent, setUpdatedCommentContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const dispatch = useDispatch();

    async function handleReply(parentCommentId) {
        if (!reply.trim()) return;

        try {
            setIsReplying(true);
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/comment/${parentCommentId}/${blogId}`,
                { reply },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setReply("");
            setActiveReply(null);
            dispatch(setReplies(res.data.newReply));
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setIsReplying(false);
        }
    }

    async function handleCommentLike(commentId) {
        try {
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/like-comment/${commentId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            dispatch(setCommentLikes({ commentId, userId }));
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    function handleActiveReply(id) {
        setActiveReply((prev) => (prev === id ? null : id));
    }

    async function handleCommentUpdate(id) {
        if (!updatedCommentContent.trim()) return;

        try {
            setIsUpdating(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/edit-comment/${id}`,
                { updatedCommentContent },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            dispatch(setUpdatedComments(res.data.updatedComment));
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setIsUpdating(false);
            setUpdatedCommentContent("");
            setCurrentEditComment(null);
        }
    }

    return (
        <div className="space-y-6">
            {comments.map((comment) => (
                <div key={comment._id} className="group">
                    {currentEditComment === comment._id ? (
                        <div className="bg-gray-50 dark:bg-darkbg p-4 rounded-lg  border-gray-200 dark:border-darkborder">
                            <textarea
                                defaultValue={comment.comment}
                                placeholder="Edit your comment..."
                                className="w-full min-h-[100px] p-3 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent resize-none bg-white dark:bg-darkcard text-gray-800 dark:text-darktext"
                                onChange={(e) => setUpdatedCommentContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => setCurrentEditComment(null)}
                                    className="px-4 py-2 text-sm rounded-lg  border-gray-300 dark:border-darkborder hover:bg-gray-100 dark:hover:bg-darkbg text-gray-700 dark:text-darktext"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleCommentUpdate(comment._id)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500 flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Comment Header */}
                            <div className="flex items-start gap-3">
                                <Link
                                    to={`/@${comment?.user?.username}`}
                                    className="flex-shrink-0"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden  border-gray-200 dark:border-darkborder">
                                        <img
                                            src={
                                                comment?.user?.profilePic
                                                    ? comment?.user?.profilePic
                                                    : `https://api.dicebear.com/9.x/initials/svg?seed=${comment?.user?.name}`
                                            }
                                            alt="profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </Link>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/@${comment?.user?.username}`}
                                                    className="font-medium text-sm hover:underline text-gray-900 dark:text-darktext"
                                                >
                                                    {comment?.user?.name}
                                                </Link>
                                                <span className="text-xs text-gray-500 dark:text-darktext/60">
                                                    {smartFormatDate(comment.createdAt)}
                                                </span>
                                            </div>

                                        {(comment?.user?._id === userId || userId === creatorId) && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setCurrentPopup(currentPopup === comment._id ? null : comment._id)}
                                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-darkbg text-gray-500 dark:text-darktext/80"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {currentPopup === comment._id && (
                                                    <div className="absolute right-0 top-6 bg-white dark:bg-darkcard shadow-lg rounded-md py-1 w-32 z-10  border-gray-200 dark:border-darkborder">
                                                        {comment.user._id === userId && (
                                                            <button
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-darkbg text-left text-gray-700 dark:text-darktext"
                                                                onClick={() => {
                                                                    setCurrentEditComment(comment._id);
                                                                    setCurrentPopup(null);
                                                                }}
                                                            >
                                                                <Edit size={14} /> Edit
                                                            </button>
                                                        )}
                                                        <button
                                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-darkbg text-left text-red-600 dark:text-red-400"
                                                            onClick={() => {
                                                                setCommentToDelete(comment._id);
                                                                setCurrentPopup(null);
                                                            }}
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Comment Content */}
                                    <p className="mt-1 text-sm text-gray-800 dark:text-darktext">{comment.comment}</p>

                                    {/* Comment Actions */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <button
                                            onClick={() => handleCommentLike(comment._id)}
                                            className={`flex items-center gap-1 text-xs ${comment.likes.includes(userId) ? 'text-indigo-600 dark:text-accent' : 'text-gray-500 dark:text-darktext/80'}`}
                                        >
                                            <ThumbsUp size={14} fill={comment.likes.includes(userId) ? 'currentColor' : 'none'} />
                                            <span>{comment.likes.length}</span>
                                        </button>

                                        <button
                                            onClick={() => handleActiveReply(comment._id)}
                                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-darktext/80 hover:text-gray-700 dark:hover:text-accent"
                                        >
                                            <MessageCircle size={14} />
                                            <span>{comment.replies.length}</span>
                                        </button>
                                    </div>

                                    {/* Reply Input */}
                                    {activeReply === comment._id && (
                                        <div className="mt-3 ml-2 pl-4  border-gray-200 dark:border-darkborder">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={reply}
                                                        placeholder="Write a reply..."
                                                        className="w-full min-h-[60px] p-2 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent resize-none bg-white dark:bg-darkcard text-gray-800 dark:text-darktext"
                                                        onChange={(e) => setReply(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleReply(comment._id);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <button
                                                            onClick={() => setActiveReply(null)}
                                                            className="px-3 py-1 text-xs rounded-lg  border-gray-300 dark:border-darkborder hover:bg-gray-100 dark:hover:bg-darkbg text-gray-700 dark:text-darktext"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReply(comment._id)}
                                                            disabled={!reply.trim() || isReplying}
                                                            className={`px-3 py-1 text-xs rounded-lg ${reply.trim() && !isReplying ? 'bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500' : 'bg-gray-200 dark:bg-darkbg text-gray-500 dark:text-darktext/70 cursor-not-allowed'}`}
                                                        >
                                                            {isReplying ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                    Replying...
                                                                </>
                                                            ) : (
                                                                "Reply"
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                                <div className="ml-12 mt-3 pl-3  border-gray-200 dark:border-darkborder space-y-4">
                                    <DisplayComments
                                        comments={comment.replies}
                                        userId={userId}
                                        blogId={blogId}
                                        token={token}
                                        activeReply={activeReply}
                                        setActiveReply={setActiveReply}
                                        currentPopup={currentPopup}
                                        setCurrentPopup={setCurrentPopup}
                                        currentEditComment={currentEditComment}
                                        setCurrentEditComment={setCurrentEditComment}
                                        creatorId={creatorId}
                                        setCommentToDelete={setCommentToDelete}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default Comment;