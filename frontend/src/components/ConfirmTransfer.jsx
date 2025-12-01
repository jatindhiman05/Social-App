import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

export const ConfirmTransfer = () => {
    const { action, token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const confirmTransfer = async () => {
            try {
                setStatus('loading');
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/auth/confirm-transfer/${action}/${token}`
                );

                setStatus(data.success ? 'success' : 'error');
                setMessage(data.message);
                setDetails(data.data || null);

                if (data.success) {
                    toast.success(data.message);
                    // Redirect after 5 seconds to allow user to read details
                    setTimeout(() => navigate('/'), 5000);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message ||
                    "Failed to process transfer confirmation";
                setStatus('error');
                setMessage(errorMsg);
                toast.error(errorMsg);
            }
        };

        confirmTransfer();
    }, [action, token, navigate]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-accent mb-4" />
                        <h2 className="text-xl font-semibold mb-2 dark:text-darktext">
                            Processing Transfer...
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Please wait while we process your request
                        </p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2 dark:text-darktext">
                            Transfer Successful!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                            {message}
                        </p>
                        {details && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 w-full">
                                <h3 className="font-medium mb-2 dark:text-darktext">
                                    Transfer Details:
                                </h3>
                                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                    <li>• Transferred blogs: {details.transferredBlogs || 0}</li>
                                    <li>• Transferred comments: {details.transferredComments || 0}</li>
                                    <li>• Transferred followers: {details.transferredFollowers || 0}</li>
                                </ul>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-accent/90 text-white rounded-lg transition-colors"
                            >
                                Return Home
                            </button>
                            <button
                                onClick={() => navigate('/signin')}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            You will be redirected automatically in 5 seconds...
                        </p>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2 dark:text-darktext">
                            Transfer Failed
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                            {message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-accent dark:hover:bg-accent/90 text-white rounded-lg transition-colors"
                            >
                                Return Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkbg p-4">
            <div className="bg-white dark:bg-darkcard p-8 rounded-lg shadow-md max-w-md w-full">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-accent mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                {renderContent()}
            </div>
        </div>
    );
};