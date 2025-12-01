import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../utils/userSilce";
import { AtSign, KeyRound, User, ArrowLeft, Settings } from "lucide-react";
import { googleAuth, handleRedirectResult } from "../utils/firebase";

function AuthForm({ type }) {
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    async function handleAuthForm(e) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/${type}`,
                userData
            );

            if (type === "signup") {
                toast.success(res.data.message);
                navigate("/signin");
            } else {
                dispatch(login(res.data.user));
                toast.success(res.data.message);
                navigate("/");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGoogleAuth() {
        setGoogleLoading(true);
        try {
            let userData = await googleAuth();
            if (!userData) return;

            const idToken = await userData.getIdToken();

            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/google-auth`,
                { accessToken: idToken }
            );

            dispatch(login(res.data.user));
            toast.success(res.data.message);
            navigate("/");
        } catch (error) {
            console.error("Google Auth Error:", error);
            toast.error(error.response?.data?.message || "Authentication failed");
        } finally {
            setGoogleLoading(false);
        }
    }

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                const userData = await handleRedirectResult();
                if (userData) {
                    const idToken = await userData.getIdToken();
                    const res = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/google-auth`,
                        { accessToken: idToken }
                    );
                    dispatch(login(res.data.user));
                    toast.success(res.data.message);
                    navigate("/");
                }
            } catch (error) {
                console.error("Redirect Error:", error);
                toast.error("Authentication failed");
            }
        };

        handleRedirect();
    }, [dispatch, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-12 px-4 sm:px-6">
            <div className="max-w-md mx-auto">
                <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden  border-gray-200 dark:border-darkborder">
                    <div className="p-6  border-gray-200 dark:border-darkborder">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-darktext flex items-center gap-2">
                            <Settings className="text-indigo-600 dark:text-accent" />
                            {type === "signin" ? "Welcome back" : "Create account"}
                        </h1>
                        <p className="text-gray-500 dark:text-darktext/70 mt-1 text-sm">
                            {type === "signin"
                                ? "Sign in to continue to your account"
                                : "Get started with your new account"}
                        </p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleAuthForm} className="space-y-4">
                            {type === "signup" && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400 dark:text-darktext/70" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={userData.name}
                                            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                            className="block w-full pl-10 pr-3 py-2.5 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <AtSign className="h-5 w-5 text-gray-400 dark:text-darktext/70" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={userData.email}
                                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400 dark:text-darktext/70" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete={type === "signin" ? "current-password" : "new-password"}
                                        required
                                        value={userData.password}
                                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 text-sm  border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 dark:bg-accent hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent ${isLoading ? "opacity-80 cursor-not-allowed" : ""}`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    type === "signin" ? "Sign In" : "Sign Up"
                                )}
                            </button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-gray-200 dark:border-darkborder"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-darkcard text-gray-500 dark:text-darktext/70">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleGoogleAuth}
                                    disabled={googleLoading}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4  border-gray-300 dark:border-darkborder rounded-lg text-sm font-medium text-gray-700 dark:text-darktext hover:bg-gray-50 dark:hover:bg-darkbg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent"
                                >
                                    {googleLoading ? (
                                        <svg className="animate-spin h-4 w-4 text-gray-400 dark:text-darktext/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.255H17.92C17.665 15.63 16.89 16.795 15.725 17.575V20.115H19.28C21.36 18.14 22.56 15.42 22.56 12.25Z" fill="#4285F4" />
                                                <path d="M12 23C14.97 23 17.46 22.015 19.28 20.115L15.725 17.575C14.74 18.235 13.48 18.625 12 18.625C9.14 18.625 6.71 16.69 5.845 14.09H2.17V16.66C3.98 20.235 7.7 23 12 23Z" fill="#34A853" />
                                                <path d="M5.845 14.09C5.625 13.43 5.5 12.725 5.5 12C5.5 11.275 5.625 10.57 5.845 9.91V7.34H2.17C1.4 8.735 1 10.315 1 12C1 13.685 1.4 15.265 2.17 16.66L5.845 14.09Z" fill="#FBBC05" />
                                                <path d="M12 5.375C13.615 5.375 15.065 5.93 16.205 7.02L19.36 3.865C17.455 2.09 14.965 1 12 1C7.7 1 3.98 3.765 2.17 7.34L5.845 9.91C6.71 7.31 9.14 5.375 12 5.375Z" fill="#EA4335" />
                                            </svg>
                                            <span>Google</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-sm text-gray-600 dark:text-darktext/70">
                            {type === "signin" ? (
                                <>
                                    Don't have an account?{" "}
                                    <Link
                                        to="/signup"
                                        className="font-medium text-indigo-600 dark:text-accent hover:text-indigo-500 dark:hover:text-accent/80"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <Link
                                        to="/signin"
                                        className="font-medium text-indigo-600 dark:text-accent hover:text-indigo-500 dark:hover:text-accent/80"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;