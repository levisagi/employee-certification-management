import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onLogin(username, password);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A192F] to-[#112240] flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 max-w-md w-full">
        <div className="text-center mb-4 sm:mb-8">
          <img src="/images/logo.svg" alt="CertVision Logo" className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-2 sm:mb-3" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">CertVision</h1>
          <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-6">Certification Management Excellence</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-2 sm:p-4 rounded-lg mb-3 sm:mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <User size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pr-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="הזן שם משתמש"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Lock size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pr-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="הזן סיסמה"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-3 px-4 text-sm sm:text-base rounded-lg transition-colors
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;