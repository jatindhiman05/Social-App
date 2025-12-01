import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

function Modal({
    isOpen,
    onClose,
    title,
    children,
    actionButton,
    cancelButtonText = "Cancel",
    maxWidth = "max-w-md",
}) {
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle mount/unmount and visibility states
    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // Small delay to allow DOM to update before applying visible state
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => setIsMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close modal on Escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isMounted) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isMounted, onClose]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay with fade animation */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            ></div>

            {/* Modal container with centered positioning */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    className={`bg-white dark:bg-darkcard rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full ${maxWidth} ${isVisible
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-4 opacity-0 scale-95"
                        }`}
                    style={{ transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with improved styling */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-darkborder bg-gray-50 dark:bg-darkbg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-darktext">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-darktext focus:outline-none rounded-full p-1 hover:bg-gray-100 dark:hover:bg-darkborder transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content with better padding */}
                    <div className="px-6 py-5">{children}</div>

                    {/* Footer with improved button styling */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-darkbg flex justify-end gap-3 border-t border-gray-200 dark:border-darkborder">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-darktext hover:bg-gray-100 dark:hover:bg-darkborder rounded-lg transition-colors font-medium"
                        >
                            {cancelButtonText}
                        </button>
                        {actionButton}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;