import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import NestedList from "@editorjs/nested-list";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import Embed from "@editorjs/embed";
import ImageTool from "@editorjs/image";
import TextVariantTune from "@editorjs/text-variant-tune";
import { setIsOpen } from "../utils/commentSlice";
import { removeSelectedBlog } from "../utils/selectedBlogSlice";
import useLoader from "../hooks/useLoader";
import { Image, Upload, Save, ArrowLeft, X, Plus } from "lucide-react";

function AddBlog() {
    const { id } = useParams();
    const editorjsRef = useRef(null);
    const [isLoading, startLoading, stopLoading] = useLoader();
    const formData = new FormData();

    const { token } = useSelector((silce) => silce.user);
    const { title, description, image, content, draft, tags } = useSelector(
        (slice) => slice.selectedBlog
    );

    const [blogData, setBlogData] = useState({
        title: "",
        description: "",
        image: null,
        content: "",
        tags: [],
        draft: false,
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    async function handlePostBlog() {
        formData.append("title", blogData.title);
        formData.append("description", blogData.description);
        formData.append("image", blogData.image);
        formData.append("content", JSON.stringify(blogData.content));
        formData.append("tags", JSON.stringify(blogData.tags));
        formData.append("draft", blogData.draft);

        blogData.content.blocks.forEach((block) => {
            if (block.type === "image") {
                console.log(block)
                formData.append("images", block.data.file.image);
            }
        });

        try {
            startLoading();
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/blogs`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(res)
            toast.success(res.data.message);
            navigate("/");
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message);
        } finally {
            stopLoading();
        }
    }

    async function handleUpdateBlog() {
        let formData = new FormData();

        formData.append("title", blogData.title);
        formData.append("description", blogData.description);
        formData.append("image", blogData.image);
        formData.append("content", JSON.stringify(blogData.content));
        formData.append("tags", JSON.stringify(blogData.tags));
        formData.append("draft", blogData.draft);

        let existingImages = [];

        blogData.content.blocks.forEach((block) => {
            if (block.type === "image") {
                if (block.data.file.image) {
                    formData.append("images", block.data.file.image);
                } else {
                    existingImages.push({
                        url: block.data.file.url,
                        imageId: block.data.file.imageId,
                    });
                }
            }
        });

        formData.append("existingImages", JSON.stringify(existingImages));

        try {
            startLoading();
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/` + id,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success(res.data.message);
            navigate("/");
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            stopLoading();
        }
    }

    async function fetchBlogById() {
        setBlogData({
            title: title,
            description: description,
            image: image,
            content: content,
            draft: draft,
            tags: tags,
        });
    }

    function initializeEditorjs() {
        editorjsRef.current = new EditorJS({
            holder: "editorjs",
            placeholder: "Write your story here...",
            data: content,
            tools: {
                header: {
                    class: Header,
                    inlineToolbar: true,
                    config: {
                        placeholder: "Enter a header",
                        levels: [2, 3, 4],
                        defaultLevel: 3,
                    },
                },
                List: {
                    class: NestedList,
                    config: {},
                    inlineToolbar: true,
                },
                Marker: Marker,
                Underline: Underline,
                Embed: Embed,
                textVariant: TextVariantTune,
                image: {
                    class: ImageTool,
                    config: {
                        uploader: {
                            uploadByFile: async (image) => {
                                return {
                                    success: 1,
                                    file: {
                                        url: URL.createObjectURL(image),
                                        image,
                                    },
                                };
                            },
                        },
                    },
                },
            },
            tunes: ["textVariant"],
            onChange: async () => {
                let data = await editorjsRef.current.save();
                setBlogData((blogData) => ({ ...blogData, content: data }));
            },
        });
    }

    function handleKeyDown(e) {
        const tag = e.target.value.toLowerCase();

        if (e.code === "Space" || e.keyCode == "32") {
            e.preventDefault();
        }

        if ((e.code == "Enter" || e.keyCode == "13") && tag !== "") {
            if (blogData.tags.length >= 10) {
                e.target.value = "";
                return toast.error("You can add up to 10 tags maximum");
            }
            if (blogData.tags.includes(tag)) {
                e.target.value = "";
                return toast.error("This tag already exists");
            }
            setBlogData((prev) => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
            e.target.value = "";
        }
    }

    function deleteTag(index) {
        const updatedTags = blogData.tags.filter(
            (_, tagIndex) => tagIndex !== index
        );
        setBlogData((prev) => ({ ...prev, tags: updatedTags }));
    }

    useEffect(() => {
        if (id) {
            fetchBlogById();
        }
    }, [id]);

    useEffect(() => {
        if (editorjsRef.current === null) {
            initializeEditorjs();
        }

        return () => {
            editorjsRef.current = null;
            dispatch(setIsOpen(false));
            if (
                window.location.pathname !== `/edit/${id}` &&
                window.location.pathname !== `/blog/${id}`
            ) {
                dispatch(removeSelectedBlog());
            }
        };
    }, []);

    return token == null ? (
        <Navigate to={"/signin"} />
    ) : (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-8 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-darktext dark:hover:text-accent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-darktext">
                        {id ? "Edit Blog Post" : "Create New Blog Post"}
                    </h1>
                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>

                <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Title Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-darktext mb-2">
                                Blog Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter a compelling title..."
                                onChange={(e) =>
                                    setBlogData((blogData) => ({
                                        ...blogData,
                                        title: e.target.value,
                                    }))
                                }
                                value={blogData.title}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent text-lg font-medium bg-white dark:bg-darkbg text-gray-900 dark:text-darktext"
                            />
                        </div>

                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-darktext mb-2">
                                Featured Image
                            </label>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <label htmlFor="image" className="cursor-pointer flex-1">
                                    {blogData.image ? (
                                        <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-darkbg">
                                            <img
                                                src={
                                                    typeof blogData.image == "string"
                                                        ? blogData.image
                                                        : URL.createObjectURL(blogData.image)
                                                }
                                                alt="Featured"
                                                className="w-full h-64 object-cover transition-all duration-300 group-hover:opacity-90"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-300">
                                                <div className="bg-white/90 dark:bg-darkbg/90 group-hover:bg-white dark:group-hover:bg-darkcard px-4 py-2 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Image className="w-4 h-4" />
                                                    <span>Change Image</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-darkbg rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg transition-colors duration-200">
                                            <Upload className="w-10 h-10 text-gray-400 dark:text-darktext mb-3" />
                                            <p className="text-gray-600 dark:text-darktext font-medium">Upload featured image</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                                        </div>
                                    )}
                                </label>
                                <input
                                    className="hidden"
                                    id="image"
                                    type="file"
                                    accept=".png, .jpeg, .jpg"
                                    onChange={(e) =>
                                        setBlogData((blogData) => ({
                                            ...blogData,
                                            image: e.target.files[0],
                                        }))
                                    }
                                />

                                <div className="flex-1 space-y-6">
                                    {/* Description Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-darktext mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Write a short description that will appear in previews..."
                                            value={blogData.description}
                                            className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent resize-none bg-white dark:bg-darkbg text-gray-900 dark:text-darktext"
                                            onChange={(e) =>
                                                setBlogData((blogData) => ({
                                                    ...blogData,
                                                    description: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>

                                    {/* Tags Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-darktext mb-2">
                                            Tags
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Add tags (press Enter to add)"
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-darkbg rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-900 dark:text-darktext"
                                                onKeyDown={handleKeyDown}
                                            />
                                            <div className="absolute right-3 top-3 text-sm text-gray-500 dark:text-gray-400">
                                                {10 - blogData.tags.length} remaining
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {blogData?.tags?.map((tag, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center bg-indigo-50 dark:bg-darkbg text-indigo-700 dark:text-accent rounded-full px-3 py-1 text-sm"
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => deleteTag(index)}
                                                        className="ml-1.5 text-indigo-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-accent"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                            {/* Content Editor Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-darktext mb-2">
                                    Content
                                </label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <div id="editorjs" className="min-h-[500px] p-4 bg-white"></div>
                                </div>
                            </div>



                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-darkbg">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-darktext">
                                    Publication Status:
                                </label>
                                <div className="flex bg-gray-100 dark:bg-darkbg p-1 rounded-lg">
                                    <button
                                        onClick={() => setBlogData(prev => ({ ...prev, draft: false }))}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!blogData.draft ? 'bg-white dark:bg-darkcard shadow-sm text-indigo-700 dark:text-accent' : 'text-gray-600 dark:text-darktext hover:text-gray-800 dark:hover:text-accent'
                                            }`}
                                    >
                                        Publish
                                    </button>
                                    <button
                                        onClick={() => setBlogData(prev => ({ ...prev, draft: true }))}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${blogData.draft ? 'bg-white dark:bg-darkcard shadow-sm text-indigo-700 dark:text-accent' : 'text-gray-600 dark:text-darktext hover:text-gray-800 dark:hover:text-accent'
                                            }`}
                                    >
                                        Draft
                                    </button>
                                </div>
                            </div>

                            {!isLoading ? (
                                <button
                                    onClick={id ? handleUpdateBlog : handlePostBlog}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-accent hover:bg-indigo-700 dark:hover:bg-indigo-400 rounded-lg text-white font-medium transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    {blogData.draft
                                        ? id
                                            ? "Update Draft"
                                            : "Save as Draft"
                                        : id
                                            ? "Update Blog"
                                            : "Publish Blog"}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-400 dark:bg-darkbg rounded-lg text-white font-medium"
                                >
                                    <div className="animate-spin">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                    Processing...
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddBlog;