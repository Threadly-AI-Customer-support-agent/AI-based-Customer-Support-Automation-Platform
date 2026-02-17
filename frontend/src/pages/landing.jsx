import React from 'react'
import { Link } from 'react-router-dom'
import "../style/landing.css" // Styling ke liye

export default function LandingPage() {
    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Support AI</h2>
                </div>
                <div className='navlist'>
                    <Link to="/auth">Login</Link>
                    <div role='button'>
                        <Link to="/auth">Register</Link>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1>Welcome to <span>Support AI</span></h1>
                    <p>Experience the next generation of customer service automation...</p>
                    <div role='button'>
                        <Link to="/auth">Get Started</Link>
                    </div>
                </div>
                <div>
                    {/* Yahan tumhari background image ya illustration aayega */}
                    <img src="/mobile.png" alt="AI Support" />
                </div>
            </div>
        </div>
    )
}