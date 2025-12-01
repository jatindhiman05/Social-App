import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Target, Globe2, BookOpen, Code2, Users, Rocket, ArrowRight, ArrowLeft } from "lucide-react";

function AboutPage() {
    const { token } = useSelector((state) => state.user);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Hero Section */}
                <section className="text-center mb-12">
                    <div className="relative inline-block mb-8">
                        <div className="absolute -inset-4 bg-indigo-100 dark:bg-darkcard rounded-full opacity-75 blur-lg"></div>
                        <div className="relative bg-white dark:bg-darkcard rounded-full p-2 shadow-sm">
                            <img
                                src="https://res.cloudinary.com/df19wbn0d/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1743484881/WhatsApp_Image_2025-01-18_at_23.23.17_bc50be96_shaq4m.jpg"
                                alt="Jatin Dhiman"
                                className="w-32 h-32 rounded-full object-cover  border-white dark:border-darkbg"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-darktext mb-4">
                        Hi, I'm Jatin Dhiman
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-darktext/80 max-w-3xl mx-auto">
                        Software developer passionate about creating exceptional web experiences and sharing knowledge with the community.
                    </p>
                </section>

                {/* Mission Section */}
                <section className="bg-white dark:bg-darkcard rounded-xl shadow-sm p-8 mb-12  border-gray-200 dark:border-darkborder">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-3 bg-indigo-50 dark:bg-darkbg px-4 py-2 rounded-full mb-6">
                                <Target className="w-5 h-5 text-indigo-600 dark:text-accent" />
                                <span className="text-sm font-medium text-indigo-600 dark:text-accent">MY MISSION</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-darktext mb-6">
                                Empowering developers through knowledge sharing
                            </h2>
                            <p className="text-gray-600 dark:text-darktext/80 leading-relaxed mb-6">
                                I believe in the power of community-driven learning. Its goal is to create content that bridges the gap between theory and practical implementation, helping developers at all levels grow their skills.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to={'https://jatindhiman-portfolio.netlify.app/'}
                                    className="flex items-center gap-2 bg-white dark:bg-darkbg  border-gray-200 dark:border-darkborder hover:border-indigo-300 dark:hover:border-accent text-gray-700 dark:text-darktext hover:text-indigo-600 dark:hover:text-accent px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                                    target="_blank"
                                >
                                    <Users className="w-5 h-5" />
                                    My Portfolio
                                </Link>
                            </div>
                        </div>
                        <div className="flex-1">
                            <img
                                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=60"
                                alt="Coding illustration"
                                className="rounded-lg shadow-sm w-full h-auto object-cover  border-gray-200 dark:border-darkborder"
                            />
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-darktext mb-8">My Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-darkcard p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow  border-gray-200 dark:border-darkborder">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-darkbg rounded-lg flex items-center justify-center mb-4">
                                <Code2 className="w-5 h-5 text-indigo-600 dark:text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-darktext mb-2">Technical Excellence</h3>
                            <p className="text-gray-600 dark:text-darktext/80 text-sm">
                                Committed to staying at the forefront of web technologies and sharing practical, up-to-date knowledge.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-darkcard p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow  border-gray-200 dark:border-darkborder">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-darkbg rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-darktext mb-2">Continuous Learning</h3>
                            <p className="text-gray-600 dark:text-darktext/80 text-sm">
                                Believing that growth comes from both teaching and being open to learning from others.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-darkcard p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow  border-gray-200 dark:border-darkborder">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-darkbg rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-5 h-5 text-indigo-600 dark:text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-darktext mb-2">Community First</h3>
                            <p className="text-gray-600 dark:text-darktext/80 text-sm">
                                Building an inclusive space where developers can connect, share, and grow together.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="text-center">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-accent dark:to-indigo-400 rounded-xl shadow-sm p-8 text-white">
                        <h2 className="text-2xl font-bold mb-4">Ready to join the community?</h2>
                        <p className="text-indigo-100 dark:text-darktext/80 mb-6 max-w-2xl mx-auto">
                            Whether you're here to learn, share, or connect, I welcome you to be part of this growing network of developers.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                to={token ? "/add-blog" : "/signin"}
                                className="flex items-center gap-2 bg-white text-indigo-600 dark:text-darkbg hover:bg-gray-100 dark:hover:bg-darkbg/20 px-6 py-3 rounded-lg font-medium shadow-md transition-colors"
                            >
                                <Globe2 className="w-5 h-5" />
                                Get Started
                            </Link>
                            <Link
                                to="/"
                                className="flex items-center gap-2 bg-transparent  border-white text-white hover:bg-white hover:bg-opacity-10 px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                <BookOpen className="w-5 h-5" />
                                Browse
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutPage;