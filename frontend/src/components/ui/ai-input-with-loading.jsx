import { CornerRightUp, Paperclip, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "./textarea";
import { cn } from "../../lib/utils";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";

export function AIInputWithLoading({
    id = "ai-input-with-loading",
    placeholder = "Ask me anything!",
    minHeight = 56,
    maxHeight = 200,
    loadingDuration = 3000,
    thinkingDuration = 1000,
    onSubmit,
    onImageUpload,
    onVoiceToggle,
    recording = false,
    className,
    autoAnimate = false
}) {
    const [inputValue, setInputValue] = useState("");
    const [submitted, setSubmitted] = useState(autoAnimate);
    const [isAnimating, setIsAnimating] = useState(autoAnimate);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight,
        maxHeight,
    });

    useEffect(() => {
        let timeoutId;

        const runAnimation = () => {
            if (!isAnimating) return;
            setSubmitted(true);
            timeoutId = setTimeout(() => {
                setSubmitted(false);
                timeoutId = setTimeout(runAnimation, thinkingDuration);
            }, loadingDuration);
        };

        if (isAnimating) {
            runAnimation();
        }

        return () => clearTimeout(timeoutId);
    }, [isAnimating, loadingDuration, thinkingDuration]);

    // If loading finishes externally, reset submitted state
    // But since we want to handle the loading state passed as prop if available,
    // let's just make sure input works nicely.

    const handleSubmit = async () => {
        if (!inputValue.trim() || submitted) return;

        setSubmitted(true);
        if (onSubmit) {
            await onSubmit(inputValue);
        }
        setInputValue("");
        adjustHeight(true);

        // Auto reset submission state if loading finished
        setTimeout(() => {
            setSubmitted(false);
        }, loadingDuration);
    };

    return (
        <div className={cn("w-full py-2", className)}>
            <div className="relative w-full flex items-start flex-col gap-2">
                <div className="relative w-full">
                    <Textarea
                        id={id}
                        placeholder={placeholder}
                        className={cn(
                            "w-full bg-gray-800 rounded-3xl pl-[100px] pr-12 py-4",
                            "placeholder:text-gray-500",
                            "border border-gray-700 ring-0 focus-visible:ring-1 focus-visible:ring-blue-500",
                            "text-white resize-none text-wrap leading-[1.2]",
                            `min-h-[${minHeight}px] max-h-[${maxHeight}px]`
                        )}
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        disabled={submitted || recording}
                    />

                    {/* Left Actions */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <label className="cursor-pointer text-gray-400 hover:text-white transition p-2 rounded-xl">
                            <Paperclip className="w-5 h-5" />
                            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" disabled={submitted || recording} />
                        </label>
                        <button
                            onClick={onVoiceToggle}
                            disabled={submitted}
                            className={cn("p-2 rounded-xl transition", recording ? "text-red-500" : "text-gray-400 hover:text-white")}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Right Submit */}
                    <button
                        onClick={handleSubmit}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 transition",
                            submitted || !inputValue.trim() ? "bg-gray-700 cursor-not-allowed text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                        type="button"
                        disabled={submitted || !inputValue.trim() || recording}
                    >
                        {submitted ? (
                            <div
                                className="w-4 h-4 bg-white rounded-sm animate-spin transition duration-700"
                                style={{ animationDuration: "3s" }}
                            />
                        ) : (
                            <CornerRightUp className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
