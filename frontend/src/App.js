import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/landing'; // 👈 Check karo ye import sahi hai
import Authentication from './pages/authentication';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ❌ Agar yahan element={<h1>Landing Page</h1>} likha hai toh use badlo */}
          <Route path="/" element={<LandingPage />} /> 
          
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<h1>Home Dashboard</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;