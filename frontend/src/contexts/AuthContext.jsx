import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Check karo ki kya pehle se token browser mein hai
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Aage ja kar hum yahan ek 'verify token' API call bhi add kar sakte hain
            setUser({ token }); 
        }
    }, []);

    const handleAuth = (data) => {
        localStorage.setItem("token", data.accessToken); // JWT save karna
        setUser(data.user);
        navigate("/home"); // Successful login ke baad redirect
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/auth");
    };

    return (
        <AuthContext.Provider value={{ user, handleAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};