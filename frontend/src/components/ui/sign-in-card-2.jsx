import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight } from 'lucide-react';

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-blue-600 selection:text-white dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
                "focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20",
                className
            )}
            {...props}
        />
    )
}

export function SignInCard({
    title = "Welcome Back",
    subtitle = "Sign in to continue to Threadly",
    buttonText = "Sign In",
    bottomText = "Don't have an account?",
    bottomLink = "/register",
    bottomLinkText = "Sign up",
    showRoleToggle = true,
    onSubmit
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [selectedRole, setSelectedRole] = useState("CUSTOMER");

    // For 3D card effect - increased rotation range for more pronounced 3D effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        if (onSubmit) {
            try {
                await onSubmit({ email, password, role: selectedRole });
            } catch (err) {
                // error handled by parent
            }
        }
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <div className="min-h-screen w-screen bg-transparent relative overflow-hidden flex flex-col items-center justify-center">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm relative z-10"
                style={{ perspective: 1500 }}
            >
                <motion.div
                    className="relative"
                    style={{ rotateX, rotateY }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    whileHover={{ z: 10 }}
                >
                    <div className="relative group">
                        {/* Card glow effect - reduced intensity */}
                        <motion.div
                            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
                            animate={{
                                boxShadow: [
                                    "0 0 10px 2px rgba(255,255,255,0.03)",
                                    "0 0 15px 5px rgba(255,255,255,0.05)",
                                    "0 0 10px 2px rgba(255,255,255,0.03)"
                                ],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatType: "mirror"
                            }}
                        />

                        {/* Traveling light beam effect - reduced opacity */}
                        <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
                            {/* Top/Right/Bottom/Left light beams */}
                            <motion.div
                                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    left: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                                    filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror" }
                                }}
                            />
                        </div>

                        {/* Glass card background */}
                        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.05] shadow-2xl overflow-hidden">
                            {/* Subtle card inner patterns */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                                    backgroundSize: '30px 30px'
                                }}
                            />

                            {/* Logo and header */}
                            <div className="text-center space-y-1 mb-6">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", duration: 0.8 }}
                                    className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden"
                                >
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-blue-400">T</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                                >
                                    {title}
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-white/60 text-sm"
                                >
                                    {subtitle}
                                </motion.p>
                            </div>

                            {/* Login form */}
                            <form onSubmit={handleFormSubmit} className="space-y-4">

                                <motion.div className="space-y-3">
                                    {/* Email input */}
                                    <motion.div
                                        whileFocus={{ scale: 1.02 }}
                                        whileHover={{ scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <div className="relative flex items-center overflow-hidden rounded-lg">
                                            <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "email" ? 'text-white' : 'text-white/40'}`} />
                                            <Input
                                                type="email"
                                                placeholder="Email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocusedInput("email")}
                                                onBlur={() => setFocusedInput(null)}
                                                className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Password input */}
                                    <motion.div
                                        whileFocus={{ scale: 1.02 }}
                                        whileHover={{ scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <div className="relative flex items-center overflow-hidden rounded-lg">
                                            <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "password" ? 'text-white' : 'text-white/40'}`} />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setFocusedInput("password")}
                                                onBlur={() => setFocusedInput(null)}
                                                className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10"
                                            />
                                            <div onClick={() => setShowPassword(!showPassword)} className="absolute right-3 cursor-pointer">
                                                {showPassword ? <Eye className="w-4 h-4 text-white/40 hover:text-white" /> : <EyeClosed className="w-4 h-4 text-white/40 hover:text-white" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="relative">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={() => setRememberMe(!rememberMe)}
                                                className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                                            />
                                            {rememberMe && (
                                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center text-black pointer-events-none">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </motion.div>
                                            )}
                                        </div>
                                        <label htmlFor="remember-me" className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200">
                                            Remember me
                                        </label>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full relative mt-5"
                                >
                                    <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                            {isLoading ? (
                                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                                                    <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                                                </motion.div>
                                            ) : (
                                                <motion.span key="button-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-medium">
                                                    {buttonText}
                                                    <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1" />
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>

                                <motion.p className="text-center text-xs text-white/60 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                    {bottomText}{' '}
                                    <Link href={bottomLink} to={bottomLink} className="relative inline-block text-white font-medium">
                                        {bottomLinkText}
                                    </Link>
                                </motion.p>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Agent login button — outside the 3D card to guarantee clickability */}
            {showRoleToggle && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative z-20 mt-4 flex justify-center"
                >
                    <button
                        type="button"
                        onClick={() => setSelectedRole(prev => prev === 'CUSTOMER' ? 'AGENT' : 'CUSTOMER')}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium rounded-xl border border-white/10 bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.12] hover:border-white/25 backdrop-blur-sm transition-all duration-300 cursor-pointer"
                    >
                        {selectedRole === 'CUSTOMER' ? 'Sign in as Agent →' : '← Back to User sign in'}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
