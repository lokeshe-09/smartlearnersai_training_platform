import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string>('');

  const handleLoginSuccess = (username: string) => {
    setUser(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#00A0E3] via-[#0060A9] to-[#002B5C] flex items-center justify-center ${isLoggedIn ? 'p-0' : 'p-4'}`}>
      {/* Background Decorative Elements (Bubbles) - Persistent across both views */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-[#004C8C]/40 rounded-full blur-3xl animate-float-delayed pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl animate-float pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[10%] w-72 h-72 bg-blue-900/20 rounded-full blur-3xl animate-float-delayed pointer-events-none"></div>

      {/* Main Content Area */}
      <div className={`relative z-10 transition-all duration-700 ease-in-out ${isLoggedIn ? 'w-full h-screen' : 'w-full max-w-md'}`}>
        {isLoggedIn ? (
          <Dashboard onLogout={handleLogout} username={user} />
        ) : (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </div>
  );
};

export default App;