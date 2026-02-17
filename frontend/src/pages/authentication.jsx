import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { login, register } from '../api/auth';

const Authentication = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { handleAuth } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = isLogin ? await login(formData) : await register(formData);
            handleAuth(data); // Interaction: Sending data to context
        } catch (err) {
            alert(err.response?.data?.message || "Error occurred");
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>{isLogin ? "Login" : "Register"}</h2>
            <form onSubmit={handleSubmit}>
                {!isLogin && <input type="text" placeholder="Username" onChange={(e) => setFormData({...formData, username: e.target.value})} />}
                <br /><br />
                <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <br /><br />
                <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <br /><br />
                <button type="submit">{isLogin ? "Login" : "Register"}</button>
            </form>
            <p onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: 'blue'}}>
                {isLogin ? "New user? Register here" : "Already have an account? Login"}
            </p>
        </div>
    );
};

export default Authentication;