import { cn } from "../../lib/utils"

export default function ShimmerButton({
    children = 'Shimmer',
    className,
    ...props
}) {
    return (
        <button
            className={cn(
                'inline-flex h-12 animate-[shimmer2_2s_infinite_linear] items-center justify-center rounded-xl border border-white/20 bg-[linear-gradient(110deg,#ffffff10,45%,#ffffff30,55%,#ffffff10)] bg-[length:200%_100%] px-6 font-medium text-white transition-all hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md',
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
