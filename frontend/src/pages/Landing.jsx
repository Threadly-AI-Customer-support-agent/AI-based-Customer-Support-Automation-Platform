import { useNavigate } from 'react-router-dom'
import { TextScramble } from '../components/ui/text-scramble'
import { LiquidButton } from '../components/ui/liquid-glass-button'

export default function Landing() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">

            {/* 3D Glassy Brand Name Container */}
            <div className="mb-12 relative flex flex-col items-center">
                <div className="absolute inset-0 blur-3xl bg-white/5 rounded-full animate-pulse" />
                <TextScramble
                    as="h1"
                    duration={1.2}
                    speed={0.06}
                    className="text-6xl md:text-8xl font-black text-white relative z-10 text-center tracking-tight"
                >
                    Threadly
                </TextScramble>
                <p className="text-gray-400 text-center mt-6 text-lg md:text-xl font-medium tracking-wide">
                    Next-Generation AI Customer Support
                </p>
            </div>

            {/* Glass Button wrapper slightly larger to let the filter show off */}
            <div className="relative pt-8">
                <LiquidButton
                    onClick={() => navigate('/login')}
                    className="px-12 py-6 text-lg uppercase tracking-widest bg-white/5 border border-white/10 rounded-full"
                >
                    Get Started
                </LiquidButton>
            </div>

        </div>
    )
}
